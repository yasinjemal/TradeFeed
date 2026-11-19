// Read-only: picks one live shop per density rung so the new seller
// profile can be verified against real data rather than fixtures.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const rows = (await db.$queryRawUnsafe(`
    SELECT s.slug, count(p.id)::int AS n
    FROM "Shop" s
    LEFT JOIN "Product" p ON p."shopId" = s.id AND p."isActive"
    WHERE s."isActive"
    GROUP BY s.slug
    ORDER BY n DESC`)) as { slug: string; n: number }[];

  const pick = (f: (n: number) => boolean) => rows.find((x) => f(x.n));
  const report = {
    zero: pick((n) => n === 0),
    one: pick((n) => n === 1),
    two: pick((n) => n === 2),
    rail: pick((n) => n >= 3 && n <= 7),
    grid: pick((n) => n >= 8 && n <= 19),
    dense: pick((n) => n >= 20),
  };
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error("ERR:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
