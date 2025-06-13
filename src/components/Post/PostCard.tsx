import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, MoreHorizontal, Badge, Award, User, Copy, ExternalLink, Trash2, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ProfileModal } from '../Profile/ProfileModal'
import { CommentModal } from '../Comments/CommentModal'
import { LikesModal } from '../Likes/LikesModal'

interface PostCardProps {
  post: {
    id: string
    content: string
    post_type: string
    like_count: number
    comment_count: number
    created_at: string
    profiles: {
      id: string
      username: string
      display_name: string
      avatar_url: string
      post_count: number
      follower_count: number
      is_admin?: boolean
    } | null
  }
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onDelete?: () => void
}

export function PostCard({ post, onLike, onComment, onDelete }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count)
  const [loading, setLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isOwnPost = user?.id === post.profiles?.id

  useEffect(() => {
    checkIfLiked()
    
    // Subscribe to real-time like updates
    const channel = supabase
      .channel(`post-${post.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${post.id}` },
        () => {
          checkIfLiked()
          // Refresh like count
          fetchLikeCount()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [post.id, user])

  const checkIfLiked = async () => {
    if (!user) return

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()

    setIsLiked(!!data)
  }

  const fetchLikeCount = async () => {
    const { data } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', post.id)
      .single()

    if (data) {
      setLocalLikeCount(data.like_count)
    }
  }

  const handleLike = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        
        setIsLiked(false)
        setLocalLikeCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
          })
        
        setIsLiked(true)
        setLocalLikeCount(prev => prev + 1)

        // Create notification for post author
        if (post.profiles?.id && post.profiles.id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.profiles.id,
              actor_id: user.id,
              type: 'like',
              message: 'liked your post',
              post_id: post.id
            })
        }
      }
      
      onLike?.(post.id)
    } catch (error) {
      console.error('Error handling like:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComment = () => {
    setShowComments(true)
    onComment?.(post.id)
  }

  const handleDeletePost = async () => {
    if (!user || !isOwnPost || deleteLoading) return

    const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.')
    if (!confirmed) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id) // Extra security check

      if (error) {
        console.error('Delete error:', error)
        throw error
      }
      
      setShowMoreMenu(false)
      onDelete?.()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)
      setShowShareMenu(false)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleCopyText = async () => {
    try {
      const text = `${post.content}\n\n- ${post.profiles?.display_name} (@${post.profiles?.username})`
      await navigator.clipboard.writeText(text)
      setShowShareMenu(false)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.profiles?.display_name}'s post`,
          text: post.content,
          url: `${window.location.origin}/post/${post.id}`
        })
        setShowShareMenu(false)
      } catch (error) {
        console.log('Error sharing:', error)
      }
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

  const getBadgeIcon = () => {
    if (post.profiles?.is_admin) {
      return <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    } else if ((post.profiles?.follower_count || 0) >= 50) {
      return <CheckCircle className="h-4 w-4 text-blue-500 fill-current" />
    } else if ((post.profiles?.follower_count || 0) >= 100) {
      return <Award className="h-4 w-4 text-amber-500" />
    } else if ((post.profiles?.post_count || 0) >= 5) {
      return <Badge className="h-4 w-4 text-blue-500" />
    }
    return null
  }

  // Fallback values for when profile data is missing
  const profileData = {
    id: post.profiles?.id || '',
    username: post.profiles?.username || 'unknown',
    display_name: post.profiles?.display_name || 'Unknown User',
    avatar_url: post.profiles?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMoreMenu(false)
      setShowShareMenu(false)
    }

    if (showMoreMenu || showShareMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMoreMenu, showShareMenu])

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowProfile(true)}
                className="block"
                disabled={!profileData.id}
              >
                <img
                  src={profileData.avatar_url}
                  alt={profileData.display_name}
                  className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-indigo-500 transition-all duration-200"
                />
              </button>
              {getBadgeIcon() && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                  {getBadgeIcon()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowProfile(true)}
                  className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                  disabled={!profileData.id}
                >
                  {profileData.display_name}
                </button>
                <span className="text-sm text-gray-500">@{profileData.username}</span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getPostTypeEmoji(post.post_type)}</span>
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMoreMenu(!showMoreMenu)
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  <button
                    onClick={() => {
                      setShowProfile(true)
                      setShowMoreMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      handleCopyText()
                      setShowMoreMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-3" />
                    Copy Text
                  </button>
                  {isOwnPost && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleDeletePost}
                        disabled={deleteLoading}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-3" />
                        {deleteLoading ? 'Deleting...' : 'Delete Post'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-900 leading-relaxed text-lg whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 ${
                isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLikes(true)
                }}
                className="hover:underline"
              >
                {localLikeCount}
              </button>
            </button>
            
            <button
              onClick={handleComment}
              className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-all duration-200"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.comment_count}</span>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowShareMenu(!showShareMenu)
              }}
              className="flex items-center space-x-2 text-sm font-medium text-gray-500 hover:text-green-600 transition-all duration-200"
            >
              <Share className="h-5 w-5" />
            </button>

            {showShareMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-3" />
                  Copy Link
                </button>
                <button
                  onClick={handleCopyText}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-3" />
                  Copy Text
                </button>
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-3" />
                    Share
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {profileData.id && (
        <ProfileModal 
          isOpen={showProfile} 
          onClose={() => setShowProfile(false)} 
          userId={profileData.id}
        />
      )}

      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        postId={post.id}
        postContent={post.content}
        postAuthor={{
          display_name: profileData.display_name,
          username: profileData.username,
          avatar_url: profileData.avatar_url
        }}
      />

      <LikesModal
        isOpen={showLikes}
        onClose={() => setShowLikes(false)}
        postId={post.id}
        likeCount={localLikeCount}
      />
    </>
  )
}