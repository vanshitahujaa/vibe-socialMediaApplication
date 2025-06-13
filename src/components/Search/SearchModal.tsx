import React, { useState, useEffect } from 'react'
import { Search, X, User, Hash, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  type: 'user' | 'post' | 'hashtag'
  id: string
  data: any
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all')

  useEffect(() => {
    if (query.trim()) {
      const debounceTimer = setTimeout(() => {
        performSearch()
      }, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setResults([])
    }
  }, [query, activeTab])

  const performSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const searchResults: SearchResult[] = []

      // Search users
      if (activeTab === 'all' || activeTab === 'users') {
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .eq('is_banned', false)
          .limit(10)

        users?.forEach(user => {
          searchResults.push({
            type: 'user',
            id: user.id,
            data: user
          })
        })
      }

      // Search posts
      if (activeTab === 'all' || activeTab === 'posts') {
        const { data: posts } = await supabase
          .from('posts')
          .select(`
            *,
            profiles (id, username, display_name, avatar_url)
          `)
          .ilike('content', `%${query}%`)
          .eq('is_hidden', false)
          .limit(10)

        posts?.forEach(post => {
          searchResults.push({
            type: 'post',
            id: post.id,
            data: post
          })
        })
      }

      setResults(searchResults)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Search</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search for users, posts..."
              autoFocus
            />
          </div>

          {/* Search Tabs */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            {['all', 'users', 'posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : results.length === 0 && query.trim() ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No results found for "{query}"</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6">
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Start typing to search</p>
              </div>
              
              {/* Trending suggestions */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending
                </h3>
                <div className="space-y-2">
                  {['#motivation', '#poetry', '#quotes', '#lyrics'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Hash className="h-4 w-4 inline mr-2" />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {results.map((result) => (
                <div key={`${result.type}-${result.id}`} className="hover:bg-gray-50 rounded-lg p-3 transition-colors cursor-pointer">
                  {result.type === 'user' ? (
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <img
                        src={result.data.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`}
                        alt={result.data.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{result.data.display_name}</p>
                        <p className="text-sm text-gray-500">@{result.data.username}</p>
                        <p className="text-xs text-gray-400">{result.data.follower_count} followers</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getPostTypeEmoji(result.data.post_type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{result.data.profiles?.display_name}</span>
                          <span className="text-gray-500 text-xs">@{result.data.profiles?.username}</span>
                        </div>
                        <p className="text-gray-900 text-sm line-clamp-2">{result.data.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{result.data.like_count} likes</span>
                          <span>{result.data.comment_count} comments</span>
                        </div>
                      </div>
                    </div>
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