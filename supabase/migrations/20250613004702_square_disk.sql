/*
  # Enhanced Social Media Features

  1. New Tables
    - `comment_likes` - For liking comments
    - `notifications` - For user notifications
    - `hashtags` - For hashtag functionality
    - `post_hashtags` - Many-to-many relationship for posts and hashtags

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table

  3. Functions
    - Update existing trigger functions
    - Add new notification triggers
*/

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention')),
  message text NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Add like_count column to comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN like_count integer DEFAULT 0;
  END IF;
END $$;

-- Add reply_count column to comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'reply_count'
  ) THEN
    ALTER TABLE comments ADD COLUMN reply_count integer DEFAULT 0;
  END IF;
END $$;

-- Add parent_id column to comments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

-- Comment likes policies
CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own comment likes"
  ON comment_likes FOR ALL
  TO public
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO public
  WITH CHECK (true);

-- Hashtags policies
CREATE POLICY "Hashtags are viewable by everyone"
  ON hashtags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create hashtags"
  ON hashtags FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

-- Post hashtags policies
CREATE POLICY "Post hashtags are viewable by everyone"
  ON post_hashtags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage hashtags for their own posts"
  ON post_hashtags FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Function to update comment like counts
CREATE OR REPLACE FUNCTION update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment reply counts
CREATE OR REPLACE FUNCTION update_comment_reply_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update hashtag usage counts
CREATE OR REPLACE FUNCTION update_hashtag_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags 
    SET usage_count = usage_count + 1
    WHERE id = NEW.hashtag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags 
    SET usage_count = GREATEST(usage_count - 1, 0)
    WHERE id = OLD.hashtag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for comment likes
DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_counts();

-- Create triggers for comment replies
DROP TRIGGER IF EXISTS comment_replies_count_trigger ON comments;
CREATE TRIGGER comment_replies_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_counts();

-- Create triggers for hashtag usage
DROP TRIGGER IF EXISTS hashtag_usage_trigger ON post_hashtags;
CREATE TRIGGER hashtag_usage_trigger
  AFTER INSERT OR DELETE ON post_hashtags
  FOR EACH ROW EXECUTE FUNCTION update_hashtag_counts();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage_count ON hashtags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post_id ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag_id ON post_hashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);