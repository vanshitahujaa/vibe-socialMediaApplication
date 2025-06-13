import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Award, Badge, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ProfileModal } from '../Profile/ProfileModal'
import { useDebounce } from '../../hooks/useDebounce'

export function RightPanel() {
  const { user } = useAuth()
  const [trendingPosts, setTrendingPosts] = useState<any[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Debounce refresh to prevent too many API calls
  const debouncedRefresh = useDebounce(refreshing, 500)

  useEffect(() => {
    fetchTrendingPosts()
    fetchSuggestedUsers()
  }, [user])

  useEffect(() => {
    if (debouncedRefresh) {
      fetchTrendingPosts()
      fetchSuggestedUsers()
      setRefreshing(false)
    }
  }, [debouncedRefresh])

  const fetchTrendingPosts = async () => {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          like_count,
          post_type,
          created_at,
          profiles (display_name, username)
        `)
        .eq('is_hidden', false)
        .order('like_count', { ascending: false })
        .limit(5)

      setTrendingPosts(data || [])
    } catch (error) {
      console.error('Error fetching trending posts:', error)
    }
  }

  const fetchSuggestedUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, follower_count, post_count, is_admin')
        .eq('is_banned', false)

      // Exclude current user and users already followed
      if (user) {
        query = query.neq('id', user.id)
        
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        const followingIds = followingData?.map(f => f.following_id) || []
        if (followingIds.length > 0) {
          query = query.not('id', 'in', `(${followingIds.join(',')})`)
        }
      }

      const { data } = await query
        .order('follower_count', { ascending: false })
        .limit(5)

      setSuggestedUsers(data || [])
    } catch (error) {
      console.error('Error fetching suggested users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    if (!user) return

    try {
      await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        })

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          actor_id: user.id,
          type: 'follow',
          message: 'started following you'
        })

      fetchSuggestedUsers() // Refresh to remove followed user
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
  }

  const getBadgeIcon = (userProfile: any) => {
    if (userProfile.is_admin) {
      return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    } else if (userProfile.follower_count >= 100) {
      return <Award className="h-4 w-4 text-amber-500" />
    } else if (userProfile.post_count >= 5) {
      return <Badge className="h-4 w-4 text-blue-500" />
    }
    return null
  }

  const openProfile = (userId: string) => {
    setSelectedUserId(userId)
    setShowProfile(true)
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const postDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'now'
    if (diffInHours < 24) return `${diffInHours}h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d`
    return `${Math.floor(diffInDays / 7)}w`
  }

  if (loading) {
    return (
      <div className="hidden xl:block xl:w-80 xl:fixed xl:right-0 xl:top-16 xl:h-full xl:overflow-y-auto xl:bg-gray-50 xl:border-l xl:border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-200 h-48 rounded-2xl"></div>
            <div className="bg-gray-200 h-48 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="hidden xl:block xl:w-80 xl:fixed xl:right-0 xl:top-16 xl:h-full xl:overflow-y-auto xl:bg-gray-50 xl:border-l xl:border-gray-200">
        <div className="p-6 space-y-6">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Trending Posts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-gray-900">Trending</h3>
              </div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
            <div className="space-y-4">
              {trendingPosts.map((post, index) => (
                <div key={post.id} className="flex items-start space-x-3 group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2 group-hover:text-gray-700">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          @{post.profiles.username}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {post.like_count} likes
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {getTimeAgo(post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Users */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-gray-900">Who to Follow</h3>
              </div>
              <span className="text-xs text-gray-500">Suggested</span>
            </div>
            <div className="space-y-4">
              {suggestedUsers.map((userProfile) => (
                <div key={userProfile.id} className="flex items-center justify-between group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <button
                        onClick={() => openProfile(userProfile.id)}
                        className="block"
                      >
                        <img
                          src={userProfile.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                          alt={userProfile.display_name}
                          className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-indigo-500 transition-all duration-200"
                        />
                      </button>
                      {getBadgeIcon(userProfile) && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                          {getBadgeIcon(userProfile)}
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => openProfile(userProfile.id)}
                        className="font-medium text-gray-900 text-sm hover:text-indigo-600 transition-colors"
                      >
                        {userProfile.display_name}
                      </button>
                      <p className="text-xs text-gray-500">@{userProfile.username}</p>
                      <p className="text-xs text-gray-400">{userProfile.follower_count} followers</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollow(userProfile.id)}
                    className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white text-xs font-medium rounded-full hover:from-indigo-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-2xl mb-3">
                <span className="text-white text-lg font-bold">V</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Vibe</h3>
              <p className="text-sm text-gray-600 mb-4">
                Share your thoughts, connect with others, and discover amazing content.
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <a href="#" className="hover:text-gray-700 transition-colors">About</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
                <a href="#" className="hover:text-gray-700 transition-colors">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
        userId={selectedUserId || undefined}
      />
    </>
  )
}