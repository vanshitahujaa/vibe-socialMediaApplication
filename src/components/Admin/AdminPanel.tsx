import React, { useState, useEffect } from 'react'
import { Shield, Users, FileText, Eye, EyeOff, Ban, CheckCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchPosts()
      fetchUsers()
    }
  }, [isOpen])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username, display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHidePost = async (postId: string, isHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_hidden: !isHidden })
        .eq('id', postId)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !isBanned })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
    }
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
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Posts Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Users Management
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
              {posts.map((post) => (
                <div key={post.id} className={`bg-gray-50 rounded-xl p-4 ${post.is_hidden ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <img
                          src={post.profiles?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                          alt={post.profiles?.display_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{post.profiles?.display_name}</span>
                          <span className="text-gray-500 text-sm ml-2">@{post.profiles?.username}</span>
                        </div>
                        <span className="text-lg">{getPostTypeEmoji(post.post_type)}</span>
                        {post.is_hidden && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Hidden</span>
                        )}
                      </div>
                      <p className="text-gray-900 mb-2">{post.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{post.like_count} likes</span>
                        <span>{post.comment_count} comments</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleHidePost(post.id, post.is_hidden)}
                      className={`ml-4 p-2 rounded-lg transition-colors ${
                        post.is_hidden
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {post.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
              {users.map((userProfile) => (
                <div key={userProfile.id} className={`bg-gray-50 rounded-xl p-4 ${userProfile.is_banned ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={userProfile.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                        alt={userProfile.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{userProfile.display_name}</h4>
                          {userProfile.is_admin && (
                            <Shield className="h-4 w-4 text-red-600" />
                          )}
                          {userProfile.is_banned && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Banned</span>
                          )}
                        </div>
                        <p className="text-gray-600">@{userProfile.username}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{userProfile.post_count} posts</span>
                          <span>{userProfile.follower_count} followers</span>
                          <span>Joined {new Date(userProfile.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!userProfile.is_admin && (
                        <button
                          onClick={() => handleBanUser(userProfile.id, userProfile.is_banned)}
                          className={`p-2 rounded-lg transition-colors ${
                            userProfile.is_banned
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {userProfile.is_banned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}