#!/usr/bin/env tsx
// ============================================================
// Seed Script — Plans
// ============================================================
// Seeds Free, Starter, Pro, and Pro AI plans into the database
// from the canonical definitions in lib/billing/plans.ts.
// Idempotent — safe to run multiple times.
//
// USAGE: npx tsx scripts/seed-plans.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import { PLANS } from "../lib/billing/plans";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding subscription plans from lib/billing/plans.ts...\n");

  for (const plan of PLANS) {
    const data = {
      name: plan.name,
      priceInCents: plan.priceMonthly * 100,
      productLimit: plan.productLimit,
      features: JSON.stringify(plan.dbFeatures),
      isActive: true,
    };
    const row = await db.plan.upsert({
      where: { slug: plan.slug },
      update: data,
      create: { slug: plan.slug, ...data },
    });
    console.log(`  ✅ ${plan.name} plan: ${row.id}`);
  }

  console.log("\n🎉 Plans seeded successfully!");
}

main()
  .catch((err) => {
    console.error("💥 Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
