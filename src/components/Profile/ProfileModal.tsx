import React, { useState, useEffect } from 'react'
import { X, Camera, Loader, Award, Badge, Users, FileText, UserPlus, UserCheck, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId?: string
}

export function ProfileModal({ isOpen, onClose, userId }: ProfileModalProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  })

  const targetUserId = userId || user?.id
  const isOwnProfile = user?.id === targetUserId

  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchProfile()
      fetchUserPosts()
      if (!isOwnProfile) {
        checkFollowStatus()
      }
    }
  }, [isOpen, targetUserId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) throw error
      setProfile(data)
      setEditForm({
        display_name: data.display_name,
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, display_name, avatar_url)
        `)
        .eq('user_id', targetUserId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setUserPosts(data || [])
    } catch (error) {
      console.error('Error fetching user posts:', error)
    }
  }

  const checkFollowStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle()

      if (error) throw error
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  const handleFollow = async () => {
    if (!user || followLoading) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
        setIsFollowing(false)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          })
        setIsFollowing(true)

        // Create notification for the followed user
        await supabase
          .from('notifications')
          .insert({
            user_id: targetUserId,
            actor_id: user.id,
            type: 'follow',
            message: 'started following you'
          })
      }
      fetchProfile() // Refresh to update follower count
    } catch (error) {
      console.error('Error handling follow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', user.id)

      if (error) throw error
      setProfile({ ...profile, ...editForm })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = () => {
    if (profile?.is_admin) {
      return <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
      </div>
    } else if (profile?.follower_count >= 50) {
      return <CheckCircle className="h-5 w-5 text-blue-500 fill-current" />
    } else if (profile?.follower_count >= 100) {
      return <Award className="h-5 w-5 text-amber-500" />
    } else if (profile?.post_count >= 5) {
      return <Badge className="h-5 w-5 text-blue-500" />
    }
    return null
  }

  const getPostTypeEmoji = (type: string) => {
    switch (type) {
      case 'quote': return '💭'
      case 'poem': return '🎭'
      case 'thought': return '💡'
      case 'lyric': return '🎵'
      case 'hookup_line': return '😏'
      case 'hinge_prompt': return '💘'
      default: return '✨'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isOwnProfile ? 'Your Profile' : `${profile?.display_name}'s Profile`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={profile?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face`}
                    alt={profile?.display_name}
                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                  />
                  {getBadgeIcon() && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                      {getBadgeIcon()}
                    </div>
                  )}
                  {isOwnProfile && isEditing && (
                    <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-4">
                    <input
                      type="text"
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-xl"
                      placeholder="Display Name"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                      placeholder="Avatar URL"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <h3 className="text-2xl font-bold text-gray-900">{profile?.display_name}</h3>
                      {getBadgeIcon()}
                    </div>
                    <p className="text-gray-600">@{profile?.username}</p>
                    {profile?.bio && (
                      <p className="text-gray-700 mt-2 max-w-md mx-auto">{profile.bio}</p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-center space-x-8 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900">{profile?.post_count || 0}</span>
                    </div>
                    <span className="text-sm text-gray-600">Posts</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900">{profile?.follower_count || 0}</span>
                    </div>
                    <span className="text-sm text-gray-600">Followers</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900">{profile?.following_count || 0}</span>
                    </div>
                    <span className="text-sm text-gray-600">Following</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-3 mt-6">
                  {isOwnProfile ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                        isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white hover:from-indigo-700 hover:to-emerald-700'
                      }`}
                    >
                      {followLoading ? (
                        <Loader className="animate-spin h-4 w-4" />
                      ) : isFollowing ? (
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
              </div>

              {/* User Posts */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Posts</h4>
                {userPosts.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No posts yet</p>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <div key={post.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getPostTypeEmoji(post.post_type)}</span>
                          <span className="text-sm text-gray-500 capitalize">{post.post_type.replace('_', ' ')}</span>
                        </div>
                        <p className="text-gray-900 leading-relaxed">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>{post.like_count} likes</span>
                          <span>{post.comment_count} comments</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}