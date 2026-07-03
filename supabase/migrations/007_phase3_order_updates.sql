-- Add Phase 3 required fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS rental_start DATE,
ADD COLUMN IF NOT EXISTS rental_end DATE,
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT;

-- Add index for order status queries
CREATE INDEX IF NOT EXISTS idx_orders_buyer_status ON orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller_status ON orders(seller_id, status);

-- Add function to auto-release escrow after 5 days of shipped status
CREATE OR REPLACE FUNCTION auto_release_escrow()
RETURNS TRIGGER AS $$
BEGIN
  -- If order has been shipped for 5+ days and not yet delivered/released
  IF NEW.status = 'shipped' AND 
     OLD.status != 'shipped' THEN
    -- Schedule auto-release (in production, this would be a cron job)
    -- For now, we'll mark the auto_release timestamp
    NEW.auto_released_at = NOW() + INTERVAL '5 days';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-release tracking
DROP TRIGGER IF EXISTS trigger_auto_release_escrow ON orders;
CREATE TRIGGER trigger_auto_release_escrow
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_release_escrow();

-- Add function to check if order should be auto-released
CREATE OR REPLACE FUNCTION check_auto_release(order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  auto_release_time TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT auto_released_at INTO auto_release_time
  FROM orders
  WHERE id = order_id;
  
  IF auto_release_time IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN NOW() >= auto_release_time;
END;
$$ LANGUAGE plpgsql;

-- Add function to process auto-release (call this manually or via cron)
CREATE OR REPLACE FUNCTION process_auto_release()
RETURNS INTEGER AS $$
DECLARE
  order_count INTEGER;
BEGIN
  -- Update orders that should be auto-released
  UPDATE orders
  SET status = 'delivered',
      delivered_at = NOW(),
      payment_status = 'released'
  WHERE status = 'shipped'
    AND auto_released_at IS NOT NULL
    AND NOW() >= auto_released_at;
  
  GET DIAGNOSTICS order_count = ROW_COUNT;
  
  RETURN order_count;
END;
$$ LANGUAGE plpgsql;
