-- Vinted Features: Favorites, Follows, Notifications, Offers, Shipping, Conversations

-- Fix users table: add photo_url alias column
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create conversations table (fixes migration 008 dependency)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_other_user_id ON conversations(other_user_id);

-- Add read column to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Update exchange_proposals to support counter-offers
ALTER TABLE exchange_proposals DROP CONSTRAINT IF EXISTS exchange_proposals_status_check;
ALTER TABLE exchange_proposals ADD CONSTRAINT exchange_proposals_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'countered'));

-- Favorites / Wishlist
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON favorites(listing_id);

-- Follow system
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'favorite', 'follow', 'offer', 'offer_accepted', 'offer_declined',
    'order_shipped', 'order_delivered', 'message', 'review',
    'exchange_request', 'exchange_accepted', 'exchange_countered', 'price_drop'
  )),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- Shipping addresses
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_user_id ON shipping_addresses(user_id);

-- Buyer offers / price suggestions
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);

-- Recently viewed
CREATE TABLE IF NOT EXISTS recently_viewed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_id ON recently_viewed(user_id);

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

-- RLS for conversations
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = other_user_id);
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = other_user_id);

-- Fix messages RLS: allow both sender and recipient to view
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view conversation messages" ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.user_id = auth.uid() OR conversations.other_user_id = auth.uid())
    )
  );

-- RLS for favorites
CREATE POLICY "Users can view their favorites" ON favorites FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their favorites" ON favorites FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their favorites" ON favorites FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS for follows
CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete their follows" ON follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- RLS for notifications
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS for shipping_addresses
CREATE POLICY "Users can manage their addresses" ON shipping_addresses FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS for offers
CREATE POLICY "Users can view relevant offers" ON offers FOR SELECT 
  USING (auth.uid() = buyer_id OR auth.uid() IN (
    SELECT user_id FROM listings WHERE listings.id = offers.listing_id
  ));
CREATE POLICY "Users can insert offers" ON offers FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update offers" ON offers FOR UPDATE 
  USING (auth.uid() = buyer_id OR auth.uid() IN (
    SELECT user_id FROM listings WHERE listings.id = offers.listing_id
  ));

-- RLS for recently_viewed
CREATE POLICY "Users can manage their recently viewed" ON recently_viewed FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix function to use profile_pic_url or photo_url
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_photo TEXT,
  other_user_city TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT,
  listing_id UUID,
  listing_title TEXT,
  listing_image TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CASE 
      WHEN c.user_id = user_id THEN c.other_user_id 
      ELSE c.user_id 
    END as other_user_id,
    CASE 
      WHEN c.user_id = user_id THEN u2.name 
      ELSE u1.name 
    END as other_user_name,
    CASE 
      WHEN c.user_id = user_id THEN COALESCE(u2.photo_url, u2.profile_pic_url)
      ELSE COALESCE(u1.photo_url, u1.profile_pic_url)
    END as other_user_photo,
    CASE 
      WHEN c.user_id = user_id THEN u2.city 
      ELSE u1.city 
    END as other_user_city,
    lm.content as last_message,
    lm.created_at as last_message_at,
    (SELECT COUNT(*) FROM messages m 
     WHERE m.conversation_id = c.id 
     AND m.sender_id != user_id 
     AND m.read = false) as unread_count,
    c.listing_id,
    l.title as listing_title,
    l.images[1] as listing_image
  FROM conversations c
  LEFT JOIN users u1 ON c.user_id = u1.id
  LEFT JOIN users u2 ON c.other_user_id = u2.id
  LEFT JOIN listings l ON c.listing_id = l.id
  LEFT JOIN LATERAL (
    SELECT content, created_at 
    FROM messages m 
    WHERE m.conversation_id = c.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) lm ON true
  WHERE c.user_id = user_id OR c.other_user_id = user_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
