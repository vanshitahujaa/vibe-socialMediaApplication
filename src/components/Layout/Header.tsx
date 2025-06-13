import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell, Search, Plus, Menu, X, LogOut, User, Settings, Shield } from 'lucide-react'
import { ProfileModal } from '../Profile/ProfileModal'
import { AdminPanel } from '../Admin/AdminPanel'
import { NotificationPanel } from '../Notifications/NotificationPanel'
import { SearchModal } from '../Search/SearchModal'
import { supabase } from '../../lib/supabase'

interface HeaderProps {
  onCreatePost: () => void
  onNavigate?: (tab: string) => void
  onMobileMenuToggle?: () => void
  userProfile?: any
  setUserProfile?: (profile: any) => void
}

export function Header({ onCreatePost, onNavigate, onMobileMenuToggle, userProfile, setUserProfile }: HeaderProps) {
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
      fetchUnreadNotifications()
      const cleanup = subscribeToNotifications()
      return cleanup
    }
  }, [user])

  const fetchUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserProfile?.(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchUnreadNotifications = async () => {
    if (!user) return

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      setUnreadNotifications(count || 0)
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return () => {}

    const channel = supabase
      .channel(`header-notifications-${user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifications()
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchUnreadNotifications()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  const handleSettingsClick = () => {
    setIsMenuOpen(false)
    onNavigate?.('settings')
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-2xl shadow-lg">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                    <circle cx="12" cy="12" r="2" fill="white" fillOpacity="0.4"/>
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Vibe
                </h1>
                <p className="text-xs text-gray-500">Social Platform</p>
              </div>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  onClick={() => setShowSearch(true)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all duration-200 cursor-pointer"
                  placeholder="Search posts, users..."
                  readOnly
                />
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={onCreatePost}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create
              </button>
              
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <Bell className="h-6 w-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                >
                  <img
                    src={userProfile?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                  />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <button 
                      onClick={() => {
                        setShowProfile(true)
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    {userProfile?.is_admin && (
                      <button 
                        onClick={() => {
                          setShowAdmin(true)
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                      >
                        <Shield className="h-4 w-4 mr-3" />
                        Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={handleSettingsClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <button
                onClick={onCreatePost}
                className="p-2 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg hover:from-indigo-700 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
              </button>

              <button 
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              <button
                onClick={onMobileMenuToggle}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)} 
      />

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </>
  )
}