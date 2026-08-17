-- RLS Policies for users table
-- Users can view all users (needed for marketplace)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (auth.uid() = id);

-- Users can insert their own profile (handled by trigger)
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for listings table
-- Anyone can view active listings
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');

-- Users can view their own listings regardless of status
CREATE POLICY "Users can view own listings" ON listings FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own listings
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own listings
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own listings
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for orders table
-- Users can view their own orders (as buyer or seller)
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Users can only insert orders where they are the buyer
CREATE POLICY "Users can insert own orders as buyer" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Users can only update orders where they are buyer or seller
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for exchange_proposals table
-- Users can view proposals they are involved in
CREATE POLICY "Users can view own proposals" ON exchange_proposals FOR SELECT USING (auth.uid() = proposer_id);

-- Users can only insert their own proposals
CREATE POLICY "Users can insert own proposals" ON exchange_proposals FOR INSERT WITH CHECK (auth.uid() = proposer_id);

-- Users can only update their own proposals
CREATE POLICY "Users can update own proposals" ON exchange_proposals FOR UPDATE USING (auth.uid() = proposer_id);

-- Users can only delete their own proposals
CREATE POLICY "Users can delete own proposals" ON exchange_proposals FOR DELETE USING (auth.uid() = proposer_id);

-- RLS Policies for reviews table
-- Users can view reviews for orders they are involved in
CREATE POLICY "Users can view relevant reviews" ON reviews FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = reviews.order_id 
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
  )
);

-- Users can only insert reviews for orders they are involved in
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- RLS Policies for messages table
-- Users can view messages in conversations they are part of
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = sender_id);

-- Users can only insert their own messages
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can only update their own messages
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id);

-- Users can only delete their own messages
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);
