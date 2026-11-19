// Read-only: how many honest proof facts does each live shop actually
// have? This decides whether the Proof Rail's >=3 floor is a sensible
// bar or a bar nothing can clear.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const FACTS_SQL = `
  WITH f AS (
    SELECT s.id, s.slug,
      (SELECT count(*) FROM "Product" p WHERE p."shopId" = s.id AND p."isActive")::int AS products,
      (CASE WHEN COALESCE(NULLIF(s.city,''), NULLIF(s.province,'')) IS NOT NULL THEN 1 ELSE 0 END) AS place,
      1 AS since,
      (CASE WHEN COALESCE(NULLIF(s."aboutText",''), NULLIF(s.description,'')) IS NOT NULL THEN 1 ELSE 0 END) AS voice,
      (SELECT least(count(*), 3) FROM "ShopGalleryItem" g WHERE g."shopId" = s.id AND g.type <> 'VIDEO')::int AS photo,
      (SELECT least(count(*), 2) FROM "Review" r WHERE r."shopId" = s.id AND r."isApproved" AND r.comment IS NOT NULL)::int AS review
    FROM "Shop" s WHERE s."isActive")
  SELECT slug, products, (place + since + voice + photo + review) AS facts FROM f`;

async function main() {
  const dist = await db.$queryRawUnsafe(
    `SELECT facts, count(*)::int AS shops FROM (${FACTS_SQL}) t GROUP BY 1 ORDER BY 1;`,
  );
  console.log("FACT DISTRIBUTION", JSON.stringify(dist));

  const [summary] = (await db.$queryRawUnsafe(
    `SELECT count(*)::int AS shops,
            count(*) FILTER (WHERE facts >= 3)::int AS rail_renders,
            count(*) FILTER (WHERE facts >= 3 AND products <= 2)::int AS rail_on_sparse_shop
     FROM (${FACTS_SQL}) t;`,
  )) as Record<string, number>[];
  console.log("SUMMARY", JSON.stringify(summary));

  const examples = await db.$queryRawUnsafe(
    `SELECT slug, products, facts FROM (${FACTS_SQL}) t
     WHERE facts >= 3 AND products <= 2 ORDER BY products, facts DESC LIMIT 5;`,
  );
  console.log("SPARSE SHOPS THAT GET A RAIL", JSON.stringify(examples));
}

main()
  .catch((e) => {
    console.error("ERR:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
