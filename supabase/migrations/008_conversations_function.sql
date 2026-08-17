-- Add function to get user conversations with last message and unread count
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
      WHEN c.user_id = user_id THEN u2.photo_url 
      ELSE u1.photo_url 
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
