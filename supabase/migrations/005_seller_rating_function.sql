-- Create a function to calculate seller's average rating from reviews
CREATE OR REPLACE FUNCTION get_seller_rating(user_id UUID)
RETURNS DECIMAL(3, 2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE reviewee_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get seller's review count
CREATE OR REPLACE FUNCTION get_seller_review_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reviews
    WHERE reviewee_id = user_id
  );
END;
$$ LANGUAGE plpgsql;
