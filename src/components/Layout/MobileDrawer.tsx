import React from 'react'
import { X, Settings, HelpCircle, LogOut, User, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (tab: string) => void
  userProfile: any
}

export function MobileDrawer({ isOpen, onClose, onNavigate, userProfile }: MobileDrawerProps) {
  const { signOut } = useAuth()

  const handleNavigation = (tab: string) => {
    onNavigate(tab)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="lg:hidden fixed top-0 left-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Vibe
              </h2>
              <p className="text-xs text-gray-500">Navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <img
              src={userProfile?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face`}
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{userProfile?.display_name || 'User'}</h3>
              <p className="text-sm text-gray-500">@{userProfile?.username || 'username'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">{userProfile?.post_count || 0}</div>
              <div className="text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{userProfile?.follower_count || 0}</div>
              <div className="text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{userProfile?.following_count || 0}</div>
              <div className="text-gray-500">Following</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6">
          <div className="space-y-2 px-4">
            <button
              onClick={() => handleNavigation('profile')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </button>
            
            <button
              onClick={() => handleNavigation('settings')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </button>
            
            <button
              onClick={() => handleNavigation('help')}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Help & Support</span>
            </button>

            {userProfile?.is_admin && (
              <button
                onClick={() => handleNavigation('admin')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"
              >
                <Shield className="h-5 w-5" />
                <span className="font-medium">Admin Panel</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  )
}