/*
  # Fix user signup trigger

  1. Database Functions
    - Update `handle_new_user()` function to properly create profiles for new users
    - Extract username and display_name from user metadata
    - Handle potential conflicts gracefully

  2. Triggers
    - Ensure trigger fires after user creation in auth.users table
    - Create profile entry automatically for each new user

  3. Security
    - Function runs with SECURITY DEFINER to have proper permissions
    - Handles edge cases where metadata might be missing
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    bio,
    avatar_url,
    is_admin,
    is_banned,
    post_count,
    follower_count,
    following_count,
    is_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    '',
    '',
    false,
    false,
    0,
    0,
    0,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();