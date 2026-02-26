-- Full-Text Search for Product discovery
-- Uses PostgreSQL tsvector + GIN index for fast, typo-tolerant search
-- with relevance ranking. Supports English stemming.

-- 1. Enable pg_trgm for fuzzy/similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add tsvector column to Product table
ALTER TABLE "Product" ADD COLUMN "search_vector" tsvector;

-- 3. Create GIN index for fast full-text search
CREATE INDEX "Product_search_vector_idx" ON "Product" USING GIN ("search_vector");

-- 4. Create trigram indexes for fuzzy matching fallback
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- 5. Backfill existing products
UPDATE "Product" SET "search_vector" = (
  setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("description", '')), 'B')
);

-- 6. Create trigger function to auto-update search_vector on changes
CREATE OR REPLACE FUNCTION product_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."search_vector" :=
    setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Attach trigger to Product table
CREATE TRIGGER product_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "name", "description"
  ON "Product"
  FOR EACH ROW
  EXECUTE FUNCTION product_search_vector_update();
