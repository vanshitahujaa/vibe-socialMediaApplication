import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string
          avatar_url: string
          is_admin: boolean
          is_banned: boolean
          post_count: number
          follower_count: number
          following_count: number
          created_at: string
          updated_at: string
          is_verified: boolean
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string
          avatar_url?: string
          is_admin?: boolean
          is_banned?: boolean
          post_count?: number
          follower_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
          is_verified?: boolean
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string
          avatar_url?: string
          is_admin?: boolean
          is_banned?: boolean
          post_count?: number
          follower_count?: number
          following_count?: number
          created_at?: string
          updated_at?: string
          is_verified?: boolean
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          post_type: 'quote' | 'poem' | 'thought' | 'lyric' | 'hookup_line' | 'hinge_prompt'
          like_count: number
          comment_count: number
          is_hidden: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          post_type: 'quote' | 'poem' | 'thought' | 'lyric' | 'hookup_line' | 'hinge_prompt'
          like_count?: number
          comment_count?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          post_type?: 'quote' | 'poem' | 'thought' | 'lyric' | 'hookup_line' | 'hinge_prompt'
          like_count?: number
          comment_count?: number
          is_hidden?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          post_id: string
          content: string
          created_at: string
          updated_at: string
          like_count: number
          reply_count: number
          parent_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          content: string
          created_at?: string
          updated_at?: string
          like_count?: number
          reply_count?: number
          parent_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          like_count?: number
          reply_count?: number
          parent_id?: string | null
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string
          type: string
          message: string
          post_id: string | null
          comment_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id: string
          type: string
          message: string
          post_id?: string | null
          comment_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string
          type?: string
          message?: string
          post_id?: string | null
          comment_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      hashtags: {
        Row: {
          id: string
          name: string
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          usage_count?: number
          created_at?: string
        }
      }
      post_hashtags: {
        Row: {
          id: string
          post_id: string
          hashtag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          hashtag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          hashtag_id?: string
          created_at?: string
        }
      }
    }
  }
}