-- Optional "was" price per variant. Additive and nullable: existing rows are
-- untouched and nothing is backfilled.
--
-- ROLLOUT ORDER: apply this BEFORE deploying the code that goes with it.
-- Prisma selects every scalar column by default, so product and order
-- queries fail with "column does not exist" if the code arrives first.
ALTER TABLE "ProductVariant" ADD COLUMN "compareAtPriceCents" INTEGER;
