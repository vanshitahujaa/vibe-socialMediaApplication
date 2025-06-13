import React, { useState, useEffect } from 'react'
import { X, Heart, UserPlus, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface LikesModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  likeCount: number
}

interface LikeUser {
  id: string
  user_id: string
  created_at: string
  profiles: {
    id: string
    username: string
    display_name: string
    avatar_url: string
    follower_count: number
    is_admin: boolean
  }
}

export function LikesModal({ isOpen, onClose, postId, likeCount }: LikesModalProps) {
  const { user } = useAuth()
  const [likes, setLikes] = useState<LikeUser[]>([])
  const [loading, setLoading] = useState(true)
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchLikes()
      fetchFollowingStatus()
    }
  }, [isOpen, postId])

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          profiles (id, username, display_name, avatar_url, follower_count, is_admin)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLikes(data || [])
    } catch (error) {
      console.error('Error fetching likes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowingStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (error) throw error
      setFollowingUsers(new Set(data?.map(f => f.following_id) || []))
    } catch (error) {
      console.error('Error fetching following status:', error)
    }
  }

  const handleFollow = async (userId: string) => {
    if (!user) return

    try {
      const isFollowing = followingUsers.has(userId)
      
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)
        
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          })
        
        setFollowingUsers(prev => new Set(prev).add(userId))
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Likes List */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No likes yet</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={like.profiles.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                      alt={like.profiles.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{like.profiles.display_name}</span>
                        {like.profiles.is_admin && (
                          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">@{like.profiles.username}</p>
                      <p className="text-xs text-gray-400">{like.profiles.follower_count} followers</p>
                    </div>
                  </div>
                  
                  {user && like.profiles.id !== user.id && (
                    <button
                      onClick={() => handleFollow(like.profiles.id)}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        followingUsers.has(like.profiles.id)
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {followingUsers.has(like.profiles.id) ? (
                        <>
                          <UserCheck className="h-4 w-4" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}