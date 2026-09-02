-- Migration 011: Auth & Schema Fixes
-- Fixes phone NOT NULL constraint blocking OAuth profile creation,
-- adds updated_at to users, fixes missing RLS policies.

-- 1. Allow OAuth users without phone numbers
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET DEFAULT NULL;

-- 2. Add updated_at column for cache-busting and freshness tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Ensure photo_url column exists (migration 009 should have added it)
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 4. Auto-update updated_at on user profile changes
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 5. Fix missing INSERT policy for notifications
-- Currently only SELECT and UPDATE policies exist; system needs INSERT for creating notifications
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Fix missing DELETE policy for notifications
DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
CREATE POLICY "Users can delete notifications" ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Add INSERT policy for favorites (explicit, alongside existing manage policy)
DROP POLICY IF EXISTS "Users can insert favorites" ON favorites;
CREATE POLICY "Users can insert favorites" ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Ensure conversations table has proper INSERT for both participants
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = other_user_id);

-- 9. Add INSERT policy for messages (allow conversation participants to send messages)
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id = auth.uid() OR conversations.other_user_id = auth.uid())
    )
  );

-- 10. Add INSERT policies for reviews (allow viewing by reviewee as well)
DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;
CREATE POLICY "Users can view relevant reviews" ON reviews FOR SELECT USING (
  auth.uid() = reviewer_id
  OR auth.uid() = reviewee_id
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = reviews.order_id
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- 11. Add missing INSERT for reports (already had INSERT but verify)
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports" ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);
