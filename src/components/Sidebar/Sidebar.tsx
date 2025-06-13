import React from 'react'
import { Home, TrendingUp as Trending, Users, Award, Settings, HelpCircle, Sparkles, Siren as Fire, Star } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const SIDEBAR_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, gradient: 'from-blue-500 to-purple-600' },
  { id: 'trending', label: 'Trending', icon: Fire, gradient: 'from-orange-500 to-red-600' },
  { id: 'following', label: 'Following', icon: Users, gradient: 'from-green-500 to-teal-600' },
  { id: 'featured', label: 'Featured', icon: Star, gradient: 'from-yellow-500 to-orange-600' },
]

const SIDEBAR_FOOTER = [
  { id: 'settings', label: 'Settings', icon: Settings, gradient: 'from-gray-500 to-gray-600' },
  { id: 'help', label: 'Help', icon: HelpCircle, gradient: 'from-indigo-500 to-purple-600' },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-gradient-to-b lg:from-gray-50 lg:to-white lg:border-r lg:border-gray-200">
      <div className="flex-1 flex flex-col min-h-0 pt-8 pb-4 overflow-y-auto">
        {/* Logo Section */}
        <div className="px-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Navigation
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-${item.gradient.split('-')[1]}-500/25`
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md'
                }`}
              >
                <div className={`mr-3 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <Icon
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                </div>
                <span className="font-semibold">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer Navigation */}
        <div className="px-4 space-y-2 border-t border-gray-200 pt-4">
          {SIDEBAR_FOOTER.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md'
                }`}
              >
                <div className={`mr-3 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <Icon
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                </div>
                <span className="font-semibold">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom Branding */}
        <div className="px-6 py-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-lg font-bold">V</span>
            </div>
            <p className="text-xs text-gray-500">Powered by Vibe</p>
          </div>
        </div>
      </div>
    </div>
  )
}