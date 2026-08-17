-- Add indexes to support search filters efficiently
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_condition ON listings(condition);
CREATE INDEX IF NOT EXISTS idx_listings_is_rentable ON listings(is_rentable);
CREATE INDEX IF NOT EXISTS idx_listings_is_exchangeable ON listings(is_exchangeable);
CREATE INDEX IF NOT EXISTS idx_listings_user_id_status ON listings(user_id, status);
