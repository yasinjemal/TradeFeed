// ============================================================
// DB Health Check — Critical Column Guard
// ============================================================
// Verifies that columns managed outside Prisma (raw SQL migrations)
// still exist in the database. If missing, auto-heals them.
//
// WHY: The search_vector column is added via raw SQL migration
// but isn't natively managed by Prisma. Running `prisma db push`
// used to drop it, breaking product creation (P2022). We now
// declare it as Unsupported("tsvector") in the schema, but this
// script is a safety net in case it ever gets removed again.
//
// USAGE:
//   - Called on app startup from instrumentation.ts (auto-heal)
//   - Called after `db:push` via package.json script (post-push)
//   - Can be run manually: npx tsx scripts/db-health-check.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

interface HealthCheckResult {
  ok: boolean;
  checks: {
    name: string;
    status: "ok" | "fixed" | "error";
    detail: string;
  }[];
}

export async function runDbHealthCheck(
  options: { autoFix?: boolean; verbose?: boolean } = {}
): Promise<HealthCheckResult> {
  const { autoFix = true, verbose = false } = options;
  const db = new PrismaClient();
  const result: HealthCheckResult = { ok: true, checks: [] };

  try {
    // ── 1. Check search_vector column ─────────────────────
    const svCol = await db.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'Product' AND column_name = 'search_vector'`
    );

    if (svCol.length > 0) {
      result.checks.push({
        name: "search_vector column",
        status: "ok",
        detail: "Column exists on Product table",
      });
    } else if (autoFix) {
      // Auto-heal: re-add the column
      await db.$executeRawUnsafe(
        `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "search_vector" tsvector`
      );
      // Re-create GIN index
      await db.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "Product_search_vector_idx" ON "Product" USING GIN ("search_vector")`
      );
      // Backfill
      const backfilled = await db.$executeRawUnsafe(`
        UPDATE "Product" SET "search_vector" = (
          setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("description", '')), 'B')
        ) WHERE "search_vector" IS NULL
      `);
      result.checks.push({
        name: "search_vector column",
        status: "fixed",
        detail: `Column was missing — re-added and backfilled ${backfilled} products`,
      });
    } else {
      result.ok = false;
      result.checks.push({
        name: "search_vector column",
        status: "error",
        detail: "MISSING — product creation will fail with P2022",
      });
    }

    // ── 2. Check search trigger ───────────────────────────
    const trigger = await db.$queryRawUnsafe<{ trigger_name: string }[]>(
      `SELECT trigger_name FROM information_schema.triggers 
       WHERE event_object_table = 'Product' 
       AND trigger_name = 'product_search_vector_trigger'`
    );

    if (trigger.length > 0) {
      result.checks.push({
        name: "search_vector trigger",
        status: "ok",
        detail: "Trigger active on Product table",
      });
    } else if (autoFix) {
      // Re-create the trigger function and trigger
      await db.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
        BEGIN
          NEW."search_vector" :=
            setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW."description", '')), 'B');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);
      await db.$executeRawUnsafe(`
        CREATE TRIGGER product_search_vector_trigger
          BEFORE INSERT OR UPDATE OF "name", "description"
          ON "Product"
          FOR EACH ROW
          EXECUTE FUNCTION product_search_vector_update();
      `);
      result.checks.push({
        name: "search_vector trigger",
        status: "fixed",
        detail: "Trigger was missing — re-created",
      });
    } else {
      result.ok = false;
      result.checks.push({
        name: "search_vector trigger",
        status: "error",
        detail: "MISSING — full-text search won't auto-update",
      });
    }

    // ── 3. Check trigram extension ────────────────────────
    const trgm = await db.$queryRawUnsafe<{ extname: string }[]>(
      `SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`
    );

    if (trgm.length > 0) {
      result.checks.push({
        name: "pg_trgm extension",
        status: "ok",
        detail: "Fuzzy search extension active",
      });
    } else if (autoFix) {
      await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      result.checks.push({
        name: "pg_trgm extension",
        status: "fixed",
        detail: "Extension was missing — installed",
      });
    } else {
      result.ok = false;
      result.checks.push({
        name: "pg_trgm extension",
        status: "error",
        detail: "MISSING — fuzzy search won't work",
      });
    }

    // ── 4. Check trigram index ────────────────────────────
    const trgmIdx = await db.$queryRawUnsafe<{ indexname: string }[]>(
      `SELECT indexname FROM pg_indexes 
       WHERE tablename = 'Product' AND indexname = 'Product_name_trgm_idx'`
    );

    if (trgmIdx.length > 0) {
      result.checks.push({
        name: "trigram index",
        status: "ok",
        detail: "Product_name_trgm_idx exists",
      });
    } else if (autoFix) {
      await db.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops)`
      );
      result.checks.push({
        name: "trigram index",
        status: "fixed",
        detail: "Index was missing — re-created",
      });
    } else {
      result.checks.push({
        name: "trigram index",
        status: "error",
        detail: "MISSING — fuzzy search may be slow",
      });
    }

    // Determine overall status
    result.ok = result.checks.every((c) => c.status !== "error");

    if (verbose) {
      const icon = result.ok ? "✅" : "❌";
      console.log(`\n${icon} DB Health Check ${result.ok ? "PASSED" : "FAILED"}`);
      console.log("─".repeat(50));
      for (const c of result.checks) {
        const statusIcon = c.status === "ok" ? "✅" : c.status === "fixed" ? "🔧" : "❌";
        console.log(`  ${statusIcon} ${c.name}: ${c.detail}`);
      }
      console.log("");
    }

    return result;
  } finally {
    await db.$disconnect();
  }
}

// ── CLI Entry Point ─────────────────────────────────────
// Run directly: npx tsx scripts/db-health-check.ts [--no-fix] [--verbose]
if (require.main === module || process.argv[1]?.endsWith("db-health-check.ts")) {
  const args = process.argv.slice(2);
  const autoFix = !args.includes("--no-fix");
  const verbose = true; // Always verbose in CLI mode

  runDbHealthCheck({ autoFix, verbose })
    .then((result) => {
      if (!result.ok) {
        console.error("❌ DB health check failed. Fix issues above and retry.");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("❌ DB health check error:", err);
      process.exit(1);
    });
}
