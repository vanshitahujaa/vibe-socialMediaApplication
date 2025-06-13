import React, { useState } from 'react'
import { X, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const POST_TYPES = [
  { value: 'quote', label: 'Quote', emoji: '💭', placeholder: 'Share an inspiring quote...' },
  { value: 'poem', label: 'Poem', emoji: '🎭', placeholder: 'Express your poetry...' },
  { value: 'thought', label: 'Thought', emoji: '💡', placeholder: 'Share your thoughts...' },
  { value: 'lyric', label: 'Lyric', emoji: '🎵', placeholder: 'Share some lyrics...' },
  { value: 'hookup_line', label: 'Pickup Line', emoji: '😏', placeholder: 'Got a smooth line?' },
  { value: 'hinge_prompt', label: 'Hinge Prompt', emoji: '💘', placeholder: 'Creative dating prompt...' },
]

export function CreatePostModal({ isOpen, onClose, onSuccess }: CreatePostModalProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<string>('thought')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: postType as any,
        })

      if (error) throw error

      setContent('')
      setPostType('thought')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedType = POST_TYPES.find(type => type.value === postType)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are you sharing?
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {POST_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPostType(type.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      postType === type.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.emoji}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                placeholder={selectedType?.placeholder || 'Share your thoughts...'}
                maxLength={500}
                required
              />
              <div className="mt-2 text-right text-sm text-gray-500">
                {content.length}/500
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {loading ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}