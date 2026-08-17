-- Expand seed data to 100+ listings for search testing
-- This adds 50 more listings to the existing 50

INSERT INTO listings (user_id, title, description, price, rental_price_per_day, is_rentable, is_exchangeable, category, size, brand, condition, city, images, status) VALUES
-- Additional Women's Traditional (5 items)
('00000000-0000-0000-0000-000000000001', 'Digital Print Lawn', 'Vibrant digital print lawn suit with matching trousers.', 2800, 100, true, false, 'Traditional', 'M', 'Sana Safinaz', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Chikan Kari Suit', 'Hand-embroidered chikan kari suit in white.', 3500, 120, true, true, 'Traditional', 'L', 'Khaadi', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Cotton Khaddar', 'Pure cotton khaddar suit for casual wear.', 1500, 50, false, false, 'Traditional', 'M', 'Gul Ahmed', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Sequins Saree', 'Party wear saree with sequin work.', 6500, 250, true, false, 'Traditional', 'Free Size', 'Unknown', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Embroidered Shawl', 'Heavily embroidered shawl for winter.', 4000, 150, false, true, 'Traditional', 'Free Size', 'Unknown', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'], 'active'),

-- Additional Women's Western (5 items)
('00000000-0000-0000-0000-000000000001', 'Midi Skirt', 'Floral midi skirt with elastic waist.', 900, 35, true, false, 'Western', 'M', 'Zara', 'New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1583496661160-fb5886a0a0f9?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Crop Top', 'White crop top for summer.', 600, 25, false, false, 'Western', 'S', 'H&M', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Wide Leg Pants', 'Trendy wide leg pants in black.', 1100, 45, true, true, 'Western', 'M', 'Zara', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Tank Top', 'Basic cotton tank top. Pack of 2.', 700, 28, false, false, 'Western', 'M', 'Uniqlo', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Blazer Dress', 'Sophisticated blazer dress for office.', 2200, 90, true, false, 'Western', 'M', 'Mango', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400'], 'active'),

-- Additional Men's Western (5 items)
('00000000-0000-0000-0000-000000000001', 'Casual Shirt', 'Checkered casual shirt. Size L.', 950, 35, true, false, 'Western', 'L', 'Van Heusen', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Cargo Pants', 'Comfortable cargo pants with pockets.', 1300, 50, true, true, 'Western', '32', 'Levis', 'Like New', 'Lahore', ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'V-Neck T-Shirt', 'Basic v-neck t-shirt. Size M.', 450, 18, false, false, 'Western', 'M', 'Uniqlo', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1625910513413-5fc45b64e95a?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Running Shoes', 'Lightweight running shoes. Size 41.', 2400, 100, true, false, 'Western', '41', 'Nike', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Formal Trousers', 'Grey formal trousers. Size 34.', 1600, 65, true, true, 'Western', '34', 'Raymond', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400'], 'active'),

-- Additional Kids (5 items)
('00000000-0000-0000-0000-000000000001', 'Boys Jacket', 'Denim jacket for boys. Age 7-8.', 1800, 70, true, false, 'Kids', '7-8Y', 'Levis', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Girls Dress', 'Floral summer dress. Age 4-5.', 1100, 45, true, true, 'Kids', '4-5Y', 'Unknown', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Kids Cap', 'Baseball cap for kids.', 350, 15, false, false, 'Kids', 'One Size', 'Nike', 'Like New', 'Lahore', ARRAY['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Boys Shorts', 'Cotton shorts for summer. Age 6-7.', 550, 22, true, false, 'Kids', '6-7Y', 'Uniqlo', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Girls Shoes', 'Party shoes for girls. Size 26.', 950, 38, true, false, 'Kids', '26', 'Unknown', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=400'], 'active'),

-- Additional Accessories (5 items)
('00000000-0000-0000-0000-000000000001', 'Crossbody Bag', 'Leather crossbody bag in tan.', 2800, 110, true, true, 'Accessories', 'One Size', 'Unknown', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Bracelet Set', 'Set of gold-plated bracelets.', 750, 30, false, true, 'Accessories', 'One Size', 'Unknown', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Earrings', 'Stud earrings in silver.', 550, 22, true, false, 'Accessories', 'One Size', 'Unknown', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Backpack', 'Casual backpack for daily use.', 1900, 75, true, false, 'Accessories', 'One Size', 'Nike', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Scarf', 'Winter scarf in wool blend.', 650, 26, false, false, 'Accessories', 'One Size', 'Unknown', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400'], 'active'),

-- More Women's Traditional (10 items)
('00000000-0000-0000-0000-000000000001', 'Kurta Set', 'Kurta with matching trousers. Size M.', 2200, 85, true, true, 'Traditional', 'M', 'Junaid Jamshed', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Net Dupatta', 'Embroidered net dupatta.', 1800, 70, false, true, 'Traditional', 'Free Size', 'Khaadi', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Silk Kurti', 'Elegant silk kurti. Size S.', 1400, 55, true, false, 'Traditional', 'S', 'Sana Safinaz', 'New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Wool Shawl', 'Pure wool shawl for winter.', 4200, 160, true, false, 'Traditional', 'Free Size', 'Unknown', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Printed Suit', 'Modern printed lawn suit.', 2600, 100, true, true, 'Traditional', 'L', 'Gul Ahmed', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Chiffon Saree', 'Light chiffon saree with border.', 5500, 220, true, false, 'Traditional', 'Free Size', 'Unknown', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Cotton Suit', 'Simple cotton suit for daily wear.', 1100, 42, false, false, 'Traditional', 'M', 'Khaadi', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Embroidered Suit', 'Heavily embroidered party suit.', 5500, 210, true, false, 'Traditional', 'M', 'Maria B', 'Like New', 'Lahore', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Lawn Shirt', 'Casual lawn shirt. Size L.', 850, 33, true, true, 'Traditional', 'L', 'Junaid Jamshed', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Velvet Suit', 'Winter velvet suit. Size M.', 3800, 145, true, false, 'Traditional', 'M', 'Unknown', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], 'active'),

-- More Women's Western (10 items)
('00000000-0000-0000-0000-000000000001', 'Bodycon Dress', 'Black bodycon dress. Size S.', 1300, 52, true, false, 'Western', 'S', 'Zara', 'Like New', 'Lahore', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Culottes', 'Trendy culottes in beige.', 1050, 42, true, true, 'Western', 'M', 'H&M', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1583496661160-fb5886a0a0f9?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Peasant Blouse', 'Bohemian peasant blouse.', 880, 35, false, false, 'Western', 'M', 'Mango', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Skinny Jeans', 'Dark skinny jeans. Size 30.', 1650, 66, true, false, 'Western', '30', 'Levis', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Sweater Vest', 'Knit sweater vest. Size L.', 950, 38, true, true, 'Western', 'L', 'Uniqlo', 'Like New', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Wrap Dress', 'Floral wrap dress. Size M.', 1550, 62, true, false, 'Western', 'M', 'Zara', 'Good', 'Karachi', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Polo Dress', 'Casual polo dress. Size S.', 1150, 46, false, false, 'Western', 'S', 'Lacoste', 'Like New', 'Lahore', ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Cropped Jacket', 'Denim cropped jacket. Size M.', 1900, 76, true, true, 'Western', 'M', 'Levis', 'Good', 'Islamabad', ARRAY['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Slip Dress', 'Silk slip dress. Size S.', 1750, 70, true, false, 'Western', 'S', 'Unknown', 'Like New', 'Karachi', ARRAY['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400'], 'active'),
('00000000-0000-0000-0000-000000000001', 'Trench Coat', 'Classic trench coat. Size M.', 4500, 180, true, false, 'Western', 'M', 'Unknown', 'Good', 'Lahore', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'], 'active');
