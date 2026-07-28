-- User-Agent and referrer are unnecessary for TradeFeed's first-party product
-- decisions and can contain free-form identifying text. Remove historical
-- values and prevent future direct writes at the schema boundary.
ALTER TABLE "AnalyticsEvent"
  DROP COLUMN "userAgent",
  DROP COLUMN "referrer";
