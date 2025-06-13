import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { PostCard } from '../Post/PostCard'
import { Loader, Sparkles, Users, TrendingUp, Award, Settings, HelpCircle, RefreshCw } from 'lucide-react'
import { SettingsPanel } from '../Settings/SettingsPanel'
import { HelpPanel } from '../Help/HelpPanel'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { useDebounce } from '../../hooks/useDebounce'

interface FeedProps {
  feedType?: string
}

const POSTS_PER_PAGE = 10

export function Feed({ feedType = 'home' }: FeedProps) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Debounce feed type changes to avoid rapid API calls
  const debouncedFeedType = useDebounce(feedType, 300)

  const fetchPosts = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true)
        setError('')
      } else {
        setLoadingMore(true)
      }

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            post_count,
            follower_count,
            is_admin
          )
        `)
        .eq('is_hidden', false)

      // Apply feed type filters
      if (debouncedFeedType === 'following' && user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        const followingIds = followingData?.map(f => f.following_id) || []
        
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds)
        } else {
          // If not following anyone, show posts from users with high post count
          query = query.gte('profiles.post_count', 5)
        }
      } else if (debouncedFeedType === 'trending') {
        query = query.order('like_count', { ascending: false })
      } else if (debouncedFeedType === 'featured') {
        // Show posts from verified users or users with high follower count
        query = query.gte('profiles.follower_count', 10)
      }

      // Add pagination
      const from = pageNum * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      query = query
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error } = await query

      if (error) throw error

      const newPosts = data || []
      
      if (append) {
        setPosts(prev => [...prev, ...newPosts])
      } else {
        setPosts(newPosts)
      }

      // Check if we have more posts to load
      setHasMore(newPosts.length === POSTS_PER_PAGE)
      
      if (pageNum === 0) {
        setPage(1)
      } else {
        setPage(prev => prev + 1)
      }

    } catch (error: any) {
      setError(error.message)
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [user, debouncedFeedType])

  // Load more posts for infinite scroll
  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(page, true)
    }
  }, [fetchPosts, page, loadingMore, hasMore])

  // Infinite scroll hook
  const { targetRef } = useInfiniteScroll(
    loadMorePosts,
    hasMore,
    loadingMore,
    { threshold: 0.8, rootMargin: '200px' }
  )

  // Initial load and feed type changes
  useEffect(() => {
    setPosts([])
    setPage(0)
    setHasMore(true)
    fetchPosts(0, false)
  }, [debouncedFeedType, user])

  // Real-time updates
  useEffect(() => {
    if (debouncedFeedType === 'settings' || debouncedFeedType === 'help') return

    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) => {
        // Only add new posts to the top if we're on the first page and it's a relevant post
        if (page <= 1) {
          const newPost = payload.new
          // Fetch the complete post data with profile info
          fetchPostWithProfile(newPost.id).then(completePost => {
            if (completePost && shouldIncludePost(completePost)) {
              setPosts(prev => [completePost, ...prev])
            }
          })
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => prev.filter(post => post.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
        setPosts(prev => prev.map(post => 
          post.id === payload.new.id ? { ...post, ...payload.new } : post
        ))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        // Debounced refresh for like updates
        debouncedRefreshPosts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [debouncedFeedType, user, page])

  // Helper function to fetch complete post data
  const fetchPostWithProfile = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            post_count,
            follower_count,
            is_admin
          )
        `)
        .eq('id', postId)
        .eq('is_hidden', false)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching post with profile:', error)
      return null
    }
  }

  // Helper function to check if post should be included based on feed type
  const shouldIncludePost = (post: any) => {
    if (debouncedFeedType === 'following' && user) {
      // Would need to check if user follows the post author
      return true // Simplified for now
    } else if (debouncedFeedType === 'featured') {
      return (post.profiles?.follower_count || 0) >= 10
    }
    return true
  }

  // Debounced refresh function
  const debouncedRefreshPosts = useCallback(
    useDebounce(() => {
      if (!loading && !loadingMore) {
        fetchPosts(0, false)
      }
    }, 1000),
    [loading, loadingMore, fetchPosts]
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    setPosts([])
    setPage(0)
    setHasMore(true)
    await fetchPosts(0, false)
  }

  const handlePostDelete = () => {
    // Post will be removed via real-time subscription
  }

  const renderContent = () => {
    if (debouncedFeedType === 'settings') {
      return <SettingsPanel />
    }

    if (debouncedFeedType === 'help') {
      return <HelpPanel />
    }

    if (loading && posts.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your feed...</p>
          </div>
        </div>
      )
    }

    if (error && posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <p>Error loading posts: {error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    if (posts.length === 0 && !loading) {
      return (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {debouncedFeedType === 'following' ? 'No posts from people you follow' : 'No posts yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {debouncedFeedType === 'following' 
              ? 'Follow some users to see their posts here!'
              : 'Be the first to share something amazing!'
            }
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Posts */}
        {posts.map((post, index) => (
          <PostCard
            key={`${post.id}-${index}`}
            post={post}
            onLike={() => {
              // Optimistic update for better UX
              setPosts(prev => prev.map(p => 
                p.id === post.id 
                  ? { ...p, like_count: p.like_count + (p.isLiked ? -1 : 1) }
                  : p
              ))
            }}
            onComment={(postId) => {
              console.log('Comment on post:', postId)
            }}
            onDelete={handlePostDelete}
          />
        ))}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader className="animate-spin h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading more posts...</p>
            </div>
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasMore && !loadingMore && (
          <div ref={targetRef} className="h-20 flex items-center justify-center">
            <div className="text-gray-400">
              <Loader className="h-6 w-6 animate-pulse" />
            </div>
          </div>
        )}

        {/* End of feed indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <div className="w-12 h-px bg-gray-300"></div>
              <span className="text-sm">You've reached the end</span>
              <div className="w-12 h-px bg-gray-300"></div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const getFeedTitle = () => {
    switch (debouncedFeedType) {
      case 'home': return 'Home'
      case 'following': return 'Following'
      case 'trending': return 'Trending'
      case 'featured': return 'Featured'
      case 'settings': return 'Settings'
      case 'help': return 'Help'
      default: return 'Home'
    }
  }

  const getFeedIcon = () => {
    switch (debouncedFeedType) {
      case 'home': return <Sparkles className="h-5 w-5" />
      case 'following': return <Users className="h-5 w-5" />
      case 'trending': return <TrendingUp className="h-5 w-5" />
      case 'featured': return <Award className="h-5 w-5" />
      case 'settings': return <Settings className="h-5 w-5" />
      case 'help': return <HelpCircle className="h-5 w-5" />
      default: return <Sparkles className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      {debouncedFeedType !== 'settings' && debouncedFeedType !== 'help' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFeedIcon()}
            <h2 className="text-2xl font-bold text-gray-900">{getFeedTitle()}</h2>
            {posts.length > 0 && (
              <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                {posts.length} posts
              </span>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  )
}