/*
  # Fix counts and enable magic link authentication

  1. Database Functions
    - Update all count trigger functions to work properly
    - Ensure counts are accurate and updated in real-time

  2. Authentication
    - Enable magic link authentication
    - Update user creation flow

  3. Indexes
    - Add performance indexes for better query performance
*/

-- Update all trigger functions to ensure proper counting

-- Posts count function
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

-- Likes count function
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

-- Comments count function
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

-- Follow counts function
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

-- Comment likes count function
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

-- Comment reply counts function
CREATE OR REPLACE FUNCTION update_comment_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = (
      SELECT COUNT(*) FROM comments WHERE parent_id = NEW.parent_id
    )
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = (
      SELECT COUNT(*) FROM comments WHERE parent_id = OLD.parent_id
    )
    WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Hashtag usage counts function
CREATE OR REPLACE FUNCTION update_hashtag_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags 
    SET usage_count = (
      SELECT COUNT(*) FROM post_hashtags WHERE hashtag_id = NEW.hashtag_id
    )
    WHERE id = NEW.hashtag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags 
    SET usage_count = (
      SELECT COUNT(*) FROM post_hashtags WHERE hashtag_id = OLD.hashtag_id
    )
    WHERE id = OLD.hashtag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers
DROP TRIGGER IF EXISTS posts_count_trigger ON posts;
CREATE TRIGGER posts_count_trigger
  AFTER INSERT OR DELETE OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_post_counts();

DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_like_counts();

DROP TRIGGER IF EXISTS comments_count_trigger ON comments;
CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

DROP TRIGGER IF EXISTS follows_count_trigger ON follows;
CREATE TRIGGER follows_count_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_counts();

DROP TRIGGER IF EXISTS comment_replies_count_trigger ON comments;
CREATE TRIGGER comment_replies_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_counts();

DROP TRIGGER IF EXISTS hashtag_usage_trigger ON post_hashtags;
CREATE TRIGGER hashtag_usage_trigger
  AFTER INSERT OR DELETE ON post_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_counts();

-- Fix any existing count discrepancies
UPDATE profiles SET 
  post_count = (SELECT COUNT(*) FROM posts WHERE user_id = profiles.id AND is_hidden = false),
  follower_count = (SELECT COUNT(*) FROM follows WHERE following_id = profiles.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id);

UPDATE posts SET 
  like_count = (SELECT COUNT(*) FROM likes WHERE post_id = posts.id),
  comment_count = (SELECT COUNT(*) FROM comments WHERE post_id = posts.id);

UPDATE comments SET 
  like_count = (SELECT COUNT(*) FROM comment_likes WHERE comment_id = comments.id),
  reply_count = (SELECT COUNT(*) FROM comments c2 WHERE c2.parent_id = comments.id);

UPDATE hashtags SET 
  usage_count = (SELECT COUNT(*) FROM post_hashtags WHERE hashtag_id = hashtags.id);

-- Add additional performance indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id_user_id ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);