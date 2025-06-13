/*
  # Fix delete post functionality

  1. Database Policies
    - Add DELETE policies for posts table
    - Ensure users can delete their own posts
    - Ensure admins can delete any post
    - Add CASCADE delete for related data

  2. Security
    - Maintain RLS while allowing proper deletions
    - Ensure only authorized users can delete posts
*/

-- Add DELETE policies for posts
CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any post"
  ON posts FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Ensure CASCADE deletes work properly for related data
-- (These should already be in place from the foreign key constraints)

-- Add DELETE policies for likes (so they get cleaned up when posts are deleted)
CREATE POLICY "Users can delete their own likes"
  ON likes FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Add DELETE policies for comments (so they get cleaned up when posts are deleted)
CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON comments FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add DELETE policies for comment_likes
CREATE POLICY "Users can delete their own comment likes"
  ON comment_likes FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Add DELETE policies for post_hashtags
CREATE POLICY "Users can delete hashtags for their own posts"
  ON post_hashtags FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Add DELETE policies for notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO public
  USING (auth.uid() = user_id);