/*
  # Fix Count Issues

  1. Database Functions
    - Update trigger functions to properly calculate counts from database
    - Ensure counts reflect actual database state
    - Fix any existing count discrepancies

  2. Performance
    - Add proper indexes for count calculations
    - Optimize trigger functions

  3. Data Integrity
    - Recalculate all existing counts to match database reality
    - Ensure future counts are accurate
*/

-- Update like counts trigger to always calculate from database
CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = (
      SELECT COUNT(*) FROM likes WHERE post_id = NEW.post_id
    ),
    updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = (
      SELECT COUNT(*) FROM likes WHERE post_id = OLD.post_id
    ),
    updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update comment counts trigger
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comment_count = (
      SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id
    ),
    updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = (
      SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id
    ),
    updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update comment like counts trigger
CREATE OR REPLACE FUNCTION update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET like_count = (
      SELECT COUNT(*) FROM comment_likes WHERE comment_id = NEW.comment_id
    )
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET like_count = (
      SELECT COUNT(*) FROM comment_likes WHERE comment_id = OLD.comment_id
    )
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update post counts trigger
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET post_count = (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = NEW.user_id AND is_hidden = false
    ),
    updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET post_count = (
      SELECT COUNT(*) FROM posts 
      WHERE user_id = OLD.user_id AND is_hidden = false
    ),
    updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle visibility changes
    IF OLD.is_hidden != NEW.is_hidden THEN
      UPDATE profiles 
      SET post_count = (
        SELECT COUNT(*) FROM posts 
        WHERE user_id = NEW.user_id AND is_hidden = false
      ),
      updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update follow counts trigger
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update following count for follower
    UPDATE profiles 
    SET following_count = (
      SELECT COUNT(*) FROM follows WHERE follower_id = NEW.follower_id
    ),
    updated_at = now()
    WHERE id = NEW.follower_id;
    
    -- Update follower count for following
    UPDATE profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM follows WHERE following_id = NEW.following_id
    ),
    updated_at = now()
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update following count for follower
    UPDATE profiles 
    SET following_count = (
      SELECT COUNT(*) FROM follows WHERE follower_id = OLD.follower_id
    ),
    updated_at = now()
    WHERE id = OLD.follower_id;
    
    -- Update follower count for following
    UPDATE profiles 
    SET follower_count = (
      SELECT COUNT(*) FROM follows WHERE following_id = OLD.following_id
    ),
    updated_at = now()
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers to ensure they use the updated functions
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_counts();

DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_counts();

DROP TRIGGER IF EXISTS posts_count_trigger ON posts;
CREATE TRIGGER posts_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS follows_count_trigger ON follows;
CREATE TRIGGER follows_count_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Fix all existing count discrepancies by recalculating from actual data
UPDATE posts SET 
  like_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id),
  updated_at = now()
WHERE 
  like_count != (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) OR
  comment_count != (SELECT COUNT(*) FROM comments WHERE post_id = posts.id);

UPDATE comments SET 
  like_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = comments.id),
  reply_count = (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = comments.id)
WHERE 
  like_count != (SELECT COUNT(*) FROM comment_likes WHERE comment_id = comments.id) OR
  reply_count != (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = comments.id);

UPDATE profiles SET 
  post_count = (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id AND is_hidden = false),
  follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = profiles.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id),
  updated_at = now()
WHERE 
  post_count != (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id AND is_hidden = false) OR
  follower_count != (SELECT COUNT(*) FROM follows WHERE following_id = profiles.id) OR
  following_count != (SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id);

-- Add indexes to improve count calculation performance
CREATE INDEX IF NOT EXISTS idx_likes_post_id_count ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_count ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id_count ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id_count ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_user_id_visible ON posts(user_id) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_follows_follower_count ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_count ON follows(following_id);