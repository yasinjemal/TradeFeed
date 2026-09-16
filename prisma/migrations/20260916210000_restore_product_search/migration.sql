CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE OR REPLACE FUNCTION tradefeed_product_search_update() RETURNS trigger AS $$
BEGIN
 NEW.search_vector := setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') || setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B');
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tradefeed_product_search_trigger ON "Product";
CREATE TRIGGER tradefeed_product_search_trigger BEFORE INSERT OR UPDATE OF name, description ON "Product" FOR EACH ROW EXECUTE FUNCTION tradefeed_product_search_update();
UPDATE "Product" SET search_vector = setweight(to_tsvector('english', coalesce(name,'')), 'A') || setweight(to_tsvector('english', coalesce(description,'')), 'B');
CREATE INDEX IF NOT EXISTS "Product_search_vector_idx" ON "Product" USING GIN(search_vector);
