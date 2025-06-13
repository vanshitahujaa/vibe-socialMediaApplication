import React, { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthForm } from './components/Auth/AuthForm'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { MobileBottomNav } from './components/Layout/MobileBottomNav'
import { MobileDrawer } from './components/Layout/MobileDrawer'
import { RightPanel } from './components/RightPanel/RightPanel'
import { Feed } from './components/Feed/Feed'
import { CreatePostModal } from './components/Post/CreatePostModal'
import { ProfileModal } from './components/Profile/ProfileModal'
import { AdminPanel } from './components/Admin/AdminPanel'

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('home')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    
    // Handle special navigation cases
    if (tab === 'profile') {
      setShowProfile(true)
    } else if (tab === 'admin') {
      setShowAdmin(true)
    }
  }

  const handleMobileMenuToggle = () => {
    setShowMobileDrawer(!showMobileDrawer)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-2xl mb-4">
            <span className="text-white text-xl font-bold">V</span>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onCreatePost={() => setShowCreatePost(true)} 
        onNavigate={handleTabChange}
        onMobileMenuToggle={handleMobileMenuToggle}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
      
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 xl:mr-80 pb-20 lg:pb-0">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Feed feedType={activeTab} />
          </div>
        </main>

        <RightPanel />
      </div>

      {/* Mobile Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      
      <MobileDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        onNavigate={handleTabChange}
        userProfile={userProfile}
      />

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={() => {
          // Refresh feed or handle success
        }}
      />

      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)} 
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App