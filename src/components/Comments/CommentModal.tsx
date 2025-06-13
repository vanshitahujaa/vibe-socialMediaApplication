import React, { useState, useEffect } from 'react'
import { X, Send, Heart, MessageCircle, MoreHorizontal, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postContent: string
  postAuthor: {
    display_name: string
    username: string
    avatar_url: string
  }
}

interface Comment {
  id: string
  content: string
  created_at: string
  like_count: number
  reply_count: number
  parent_id: string | null
  profiles: {
    id: string
    username: string
    display_name: string
    avatar_url: string
    is_admin: boolean
  }
}

export function CommentModal({ isOpen, onClose, postId, postContent, postAuthor }: CommentModalProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchComments()
      subscribeToComments()
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (id, username, display_name, avatar_url, is_admin)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
      
      // Check which comments are liked by current user
      if (user && data) {
        const commentIds = data.map(c => c.id)
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds)
        
        setLikedComments(new Set(likes?.map(l => l.comment_id) || []))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const subscribeToComments = () => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => fetchComments()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comment_likes' },
        () => fetchComments()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: replyTo
        })

      if (error) throw error

      // Create notification for post author (if not commenting on own post)
      if (postAuthor.username !== user.user_metadata?.username) {
        const { data: postData } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', postId)
          .single()

        if (postData) {
          await supabase
            .from('notifications')
            .insert({
              user_id: postData.user_id,
              actor_id: user.id,
              type: 'comment',
              message: 'commented on your post',
              post_id: postId
            })
        }
      }

      setNewComment('')
      setReplyTo(null)
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (!user) return

    try {
      const isLiked = likedComments.has(commentId)
      
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          })

        // Create notification for comment author
        const comment = comments.find(c => c.id === commentId)
        if (comment && comment.profiles.id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: comment.profiles.id,
              actor_id: user.id,
              type: 'like',
              message: 'liked your comment',
              comment_id: commentId,
              post_id: postId
            })
        }
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const organizeComments = (comments: Comment[]) => {
    const topLevel = comments.filter(c => !c.parent_id)
    const replies = comments.filter(c => c.parent_id)
    
    return topLevel.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }))
  }

  const organizedComments = organizeComments(comments)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Comments</h2>
            <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
              {comments.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Original Post */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start space-x-3">
            <img
              src={postAuthor.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
              alt={postAuthor.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">{postAuthor.display_name}</span>
                <span className="text-gray-500 text-sm">@{postAuthor.username}</span>
              </div>
              <p className="text-gray-900 mt-1">{postContent}</p>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {organizedComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizedComments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex items-start space-x-3">
                    <img
                      src={comment.profiles.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                      alt={comment.profiles.display_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 text-sm">{comment.profiles.display_name}</span>
                        <span className="text-gray-500 text-xs">@{comment.profiles.username}</span>
                        <span className="text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-900 text-sm mt-1">{comment.content}</p>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center space-x-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-xs ${
                            likedComments.has(comment.id) ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                          } transition-colors`}
                        >
                          <Heart className={`h-3 w-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                          <span>{comment.like_count}</span>
                        </button>
                        <button
                          onClick={() => setReplyTo(comment.id)}
                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-8 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start space-x-3">
                          <img
                            src={reply.profiles.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=24&h=24&fit=crop&crop=face`}
                            alt={reply.profiles.display_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 text-xs">{reply.profiles.display_name}</span>
                              <span className="text-gray-500 text-xs">@{reply.profiles.username}</span>
                              <span className="text-gray-400 text-xs">
                                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-900 text-xs mt-1">{reply.content}</p>
                            
                            <div className="flex items-center space-x-4 mt-1">
                              <button
                                onClick={() => handleLikeComment(reply.id)}
                                className={`flex items-center space-x-1 text-xs ${
                                  likedComments.has(reply.id) ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                } transition-colors`}
                              >
                                <Heart className={`h-3 w-3 ${likedComments.has(reply.id) ? 'fill-current' : ''}`} />
                                <span>{reply.like_count}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {replyTo && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
              Replying to comment
              <button
                onClick={() => setReplyTo(null)}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>
          )}
          <form onSubmit={handleSubmitComment} className="flex space-x-3">
            <img
              src={user?.user_metadata?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
              alt="Your avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !newComment.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}