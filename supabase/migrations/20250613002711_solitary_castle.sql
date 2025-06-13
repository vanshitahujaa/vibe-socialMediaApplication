/*
  # Fix Complete Social Media Schema

  1. New Tables
    - Safely update existing tables with new columns
    - Add missing indexes and constraints
    
  2. Security
    - Update RLS policies safely
    - Ensure proper permissions for all operations
    
  3. Functions & Triggers
    - Update trigger functions for count management
    - Handle new user registration properly
*/

-- Add missing columns to existing tables safely
DO $$
BEGIN
  -- Add is_verified column to profiles if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;

-- Update existing trigger functions
CREATE OR REPLACE FUNCTION update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET post_count = post_count + 1,
        updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET post_count = GREATEST(post_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET like_count = like_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET like_count = GREATEST(like_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET comment_count = comment_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET comment_count = GREATEST(comment_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET following_count = following_count + 1,
        updated_at = now()
    WHERE id = NEW.follower_id;
    
    UPDATE profiles 
    SET follower_count = follower_count + 1,
        updated_at = now()
    WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.follower_id;
    
    UPDATE profiles 
    SET follower_count = GREATEST(follower_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, bio, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely drop and recreate triggers
DROP TRIGGER IF EXISTS posts_count_trigger ON posts;
CREATE TRIGGER posts_count_trigger
  AFTER INSERT OR DELETE ON posts
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

-- Safely handle auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_profiles_follower_count ON profiles(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_post_count ON profiles(post_count DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update RLS policies safely by dropping and recreating
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
  
  DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
  DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Admins can update any post" ON posts;
  
  DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
  DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;
  
  DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
  DROP POLICY IF EXISTS "Users can manage their own comments" ON comments;
  
  DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
  DROP POLICY IF EXISTS "Users can manage their own follows" ON follows;
END $$;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO public
  USING (NOT is_banned);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT
  TO public
  USING (
    NOT is_hidden OR 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any post"
  ON posts FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON likes FOR ALL
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own comments"
  ON comments FOR ALL
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON follows FOR ALL
  TO public
  USING (auth.uid() = follower_id);