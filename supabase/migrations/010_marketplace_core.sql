-- Marketplace core: Vinted-style checkout, shipping, protection and moderation.
-- Payments and carrier labels are represented as provider-ready records; a trusted
-- server/webhook must move payment_holds from `authorizing` to `held` after charge capture.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_price DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_protection_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES shipping_addresses(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_deadline_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_deadline_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES offers(id) ON DELETE SET NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending_payment','paid','shipped','delivered','completed','disputed','cancelled','refunded'));
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending','authorizing','held','released','refunded','failed'));

CREATE TABLE IF NOT EXISTS payment_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'pending_provider',
  provider_payment_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  status TEXT NOT NULL DEFAULT 'authorizing' CHECK (status IN ('authorizing','held','released','refunded','failed')),
  idempotency_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  service TEXT,
  tracking_number TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'label_pending' CHECK (status IN ('label_pending','label_created','shipped','in_transit','delivered','lost','returned')),
  last_event_at TIMESTAMPTZ,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('not_received','damaged','not_as_described','counterfeit','other')),
  description TEXT,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','seller_response','under_review','resolved_buyer','resolved_seller','closed')),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','checked_out','expired','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_id, seller_id, status)
);
CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price_at_addition DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bundle_id, listing_id)
);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id), CHECK (blocker_id <> blocked_id)
);
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (listing_id IS NOT NULL OR reported_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_payment_holds_order ON payment_holds(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);

ALTER TABLE payment_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view payment holds" ON payment_holds FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND auth.uid() IN (o.buyer_id, o.seller_id)));
CREATE POLICY "Participants can view shipments" ON shipments FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND auth.uid() IN (o.buyer_id, o.seller_id)));
CREATE POLICY "Participants can view disputes" ON disputes FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND auth.uid() IN (o.buyer_id, o.seller_id)));
CREATE POLICY "Buyers can view bundles" ON bundles FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can manage open bundles" ON bundles FOR ALL USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Bundle members can view items" ON bundle_items FOR SELECT USING (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND auth.uid() IN (b.buyer_id, b.seller_id)));
CREATE POLICY "Bundle buyer can manage items" ON bundle_items FOR ALL USING (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND b.buyer_id = auth.uid() AND b.status = 'open')) WITH CHECK (EXISTS (SELECT 1 FROM bundles b WHERE b.id = bundle_id AND b.buyer_id = auth.uid() AND b.status = 'open'));
CREATE POLICY "Users manage own blocks" ON user_blocks FOR ALL USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Direct client status updates are unsafe. All order state changes go through the RPC below.
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders as buyer" ON orders;

CREATE OR REPLACE FUNCTION buyer_protection_fee(p_item_price DECIMAL)
RETURNS DECIMAL LANGUAGE sql IMMUTABLE AS $$ SELECT ROUND((p_item_price * 0.05) + 70, 2) $$;

CREATE OR REPLACE FUNCTION create_marketplace_order(p_listing_id UUID, p_address_id UUID, p_shipping_method TEXT DEFAULT 'standard', p_shipping_fee DECIMAL DEFAULT 0)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_listing listings; v_address shipping_addresses; v_order UUID; v_fee DECIMAL; v_key TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.status <> 'active' THEN RAISE EXCEPTION 'This item is no longer available'; END IF;
  IF v_listing.user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot buy your own item'; END IF;
  IF EXISTS (SELECT 1 FROM user_blocks WHERE (blocker_id = auth.uid() AND blocked_id = v_listing.user_id) OR (blocker_id = v_listing.user_id AND blocked_id = auth.uid())) THEN RAISE EXCEPTION 'This transaction is unavailable'; END IF;
  SELECT * INTO v_address FROM shipping_addresses WHERE id = p_address_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Choose a valid delivery address'; END IF;
  v_fee := buyer_protection_fee(v_listing.price);
  INSERT INTO orders (listing_id,buyer_id,seller_id,type,status,payment_status,item_price,buyer_protection_fee,shipping_fee,total_amount,shipping_address_id,shipping_address,shipping_method,shipped_deadline_at)
  VALUES (v_listing.id,auth.uid(),v_listing.user_id,'buy','pending_payment','authorizing',v_listing.price,v_fee,COALESCE(p_shipping_fee,0),v_listing.price + v_fee + COALESCE(p_shipping_fee,0),v_address.id,to_jsonb(v_address),p_shipping_method,NOW() + INTERVAL '5 days') RETURNING id INTO v_order;
  v_key := v_order::text || ':' || auth.uid()::text;
  INSERT INTO payment_holds(order_id,amount,idempotency_key) VALUES (v_order,v_listing.price + v_fee + COALESCE(p_shipping_fee,0),v_key);
  UPDATE listings SET status = 'sold' WHERE id = v_listing.id;
  RETURN v_order;
END $$;

CREATE OR REPLACE FUNCTION order_action(p_order_id UUID, p_action TEXT, p_tracking_number TEXT DEFAULT NULL, p_carrier TEXT DEFAULT NULL, p_reason TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_order orders;
BEGIN
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR auth.uid() NOT IN (v_order.buyer_id, v_order.seller_id) THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF p_action = 'ship' AND auth.uid() = v_order.seller_id AND v_order.status = 'paid' AND p_tracking_number IS NOT NULL THEN
    UPDATE orders SET status = 'shipped', tracking_number = p_tracking_number, shipped_at = NOW() WHERE id = p_order_id;
    INSERT INTO shipments(order_id,carrier,tracking_number,status,last_event_at) VALUES (p_order_id,COALESCE(p_carrier,'manual'),p_tracking_number,'shipped',NOW()) ON CONFLICT (order_id) DO UPDATE SET tracking_number = EXCLUDED.tracking_number, status = 'shipped', last_event_at = NOW(), updated_at = NOW();
  ELSIF p_action = 'received' AND auth.uid() = v_order.buyer_id AND v_order.status = 'shipped' THEN
    UPDATE orders SET status = 'delivered', delivered_at = NOW(), issue_deadline_at = NOW() + INTERVAL '2 days' WHERE id = p_order_id;
  ELSIF p_action = 'confirm' AND auth.uid() = v_order.buyer_id AND v_order.status = 'delivered' THEN
    UPDATE orders SET status = 'completed', payment_status = 'released', payout_released_at = NOW() WHERE id = p_order_id;
    UPDATE payment_holds SET status = 'released', updated_at = NOW() WHERE order_id = p_order_id;
  ELSIF p_action = 'issue' AND auth.uid() = v_order.buyer_id AND v_order.status = 'delivered' AND NOW() <= v_order.issue_deadline_at THEN
    UPDATE orders SET status = 'disputed' WHERE id = p_order_id;
    INSERT INTO disputes(order_id,opened_by,reason,description) VALUES (p_order_id,auth.uid(),COALESCE(p_reason,'other'),p_description);
  ELSIF p_action = 'cancel' AND auth.uid() IN (v_order.buyer_id,v_order.seller_id) AND v_order.status IN ('pending_payment','paid') THEN
    UPDATE orders SET status = 'cancelled', payment_status = 'refunded', cancelled_at = NOW() WHERE id = p_order_id;
    UPDATE payment_holds SET status = 'refunded', updated_at = NOW() WHERE order_id = p_order_id;
    UPDATE listings SET status = 'active' WHERE id = v_order.listing_id;
  ELSE RAISE EXCEPTION 'This action is not available for the current order state'; END IF;
END $$;

-- Called only by a verified payment-provider webhook using the Supabase service role.
CREATE OR REPLACE FUNCTION settle_payment_hold(p_order_id UUID, p_provider TEXT, p_provider_payment_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE orders SET status = 'paid', payment_status = 'held', payment_transaction_id = p_provider_payment_id
  WHERE id = p_order_id AND status = 'pending_payment';
  IF NOT FOUND THEN RAISE EXCEPTION 'Order cannot be settled'; END IF;
  UPDATE payment_holds SET status = 'held', provider = p_provider, provider_payment_id = p_provider_payment_id, updated_at = NOW() WHERE order_id = p_order_id;
END $$;

CREATE OR REPLACE FUNCTION release_due_orders()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE orders SET status = 'completed', payment_status = 'released', payout_released_at = NOW()
  WHERE status = 'delivered' AND issue_deadline_at <= NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE payment_holds SET status = 'released', updated_at = NOW() WHERE status = 'held' AND order_id IN (SELECT id FROM orders WHERE status = 'completed');
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION create_marketplace_order(UUID,UUID,TEXT,DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION order_action(UUID,TEXT,TEXT,TEXT,TEXT,TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION settle_payment_hold(UUID,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION settle_payment_hold(UUID,TEXT,TEXT) TO service_role;
