import React, { useState, useEffect } from 'react'
import { User, Bell, Shield, Eye, Moon, Sun, Globe, Lock, Mail, Smartphone, Save, Camera, Edit3 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export function SettingsPanel() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  })
  const [settings, setSettings] = useState({
    notifications: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      email: false
    },
    privacy: {
      profileVisibility: 'public',
      showFollowers: true,
      showFollowing: true,
      allowMessages: true
    },
    appearance: {
      theme: 'light',
      language: 'en'
    }
  })

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Eye },
  ]

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setProfile(data)
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
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
      setSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // In a real app, you would save these settings to the database
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // You could save to a user_settings table or add columns to profiles
      console.log('Settings saved:', settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your posts, comments, and data.'
    )
    
    if (!confirmed) return

    const doubleConfirm = window.confirm(
      'This is your final warning. Deleting your account will permanently remove all your data. Type "DELETE" in the next prompt to confirm.'
    )
    
    if (!doubleConfirm) return

    const finalConfirm = prompt('Type "DELETE" to confirm account deletion:')
    if (finalConfirm !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    try {
      setSaving(true)
      
      // Delete user profile and related data (CASCADE will handle related records)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id)

      if (error) throw error

      // Sign out the user
      await signOut()
      
      alert('Your account has been successfully deleted.')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  const renderAccountSettings = () => (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Profile Information</h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-3 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            <span className="text-sm font-medium">{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative inline-block">
                <img
                  src={editForm.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face`}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                  <Camera className="h-3 w-3" />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tell us about yourself..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Avatar URL</label>
              <input
                type="url"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <img
              src={profile?.avatar_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face`}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <h5 className="text-xl font-bold text-gray-900">{profile?.display_name}</h5>
              <p className="text-gray-600">@{profile?.username}</p>
              {profile?.bio && <p className="text-gray-700 mt-1">{profile.bio}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Account Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Email</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Change
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Username</p>
            <p className="text-sm text-gray-500">@{profile?.username}</p>
          </div>
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Change
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Password</p>
            <p className="text-sm text-gray-500">Last changed 30 days ago</p>
          </div>
          <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            Change
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">Account Created</p>
            <p className="text-sm text-gray-500">{new Date(profile?.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <h4 className="text-lg font-semibold text-red-900 mb-3">Danger Zone</h4>
        <p className="text-red-700 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={saving}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Notification Preferences</h4>
        <p className="text-gray-600 text-sm">Choose what notifications you want to receive.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(settings.notifications).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {key === 'email' ? <Mail className="h-5 w-5 text-gray-400" /> : <Bell className="h-5 w-5 text-gray-400" />}
              <div>
                <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-gray-500">
                  {key === 'likes' && 'When someone likes your posts or comments'}
                  {key === 'comments' && 'When someone comments on your posts'}
                  {key === 'follows' && 'When someone follows you'}
                  {key === 'mentions' && 'When someone mentions you in a post'}
                  {key === 'email' && 'Receive notifications via email'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: {
                    ...prev.notifications,
                    [key]: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Privacy & Security</h4>
        <p className="text-gray-600 text-sm">Control who can see your information and how you interact.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Profile Visibility</p>
              <p className="text-sm text-gray-500">Who can see your profile</p>
            </div>
          </div>
          <select
            value={settings.privacy.profileVisibility}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              privacy: {
                ...prev.privacy,
                profileVisibility: e.target.value
              }
            }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="public">Public</option>
            <option value="followers">Followers Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        {Object.entries(settings.privacy).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm text-gray-500">
                  {key === 'showFollowers' && 'Display your followers list on your profile'}
                  {key === 'showFollowing' && 'Display who you follow on your profile'}
                  {key === 'allowMessages' && 'Allow others to send you direct messages'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  privacy: {
                    ...prev.privacy,
                    [key]: e.target.checked
                  }
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Appearance</h4>
        <p className="text-gray-600 text-sm">Customize how Vibe looks and feels.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {settings.appearance.theme === 'light' ? <Sun className="h-5 w-5 text-gray-400" /> : <Moon className="h-5 w-5 text-gray-400" />}
            <div>
              <p className="font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-500">Choose your preferred theme</p>
            </div>
          </div>
          <select
            value={settings.appearance.theme}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              appearance: {
                ...prev.appearance,
                theme: e.target.value
              }
            }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">Language</p>
              <p className="text-sm text-gray-500">Choose your language</p>
            </div>
          </div>
          <select
            value={settings.appearance.language}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              appearance: {
                ...prev.appearance,
                language: e.target.value
              }
            }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountSettings()
      case 'notifications':
        return renderNotificationSettings()
      case 'privacy':
        return renderPrivacySettings()
      case 'appearance':
        return renderAppearanceSettings()
      default:
        return renderAccountSettings()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {renderContent()}
          
          {/* Save Button */}
          {activeTab !== 'account' && (
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg hover:from-indigo-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}