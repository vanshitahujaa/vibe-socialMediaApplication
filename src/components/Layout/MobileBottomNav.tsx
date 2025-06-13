import React from 'react'
import { Home, TrendingUp as Trending, Users, Award, Settings, HelpCircle, Sparkles, Siren as Fire, Star } from 'lucide-react'

interface MobileBottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'trending', label: 'Trending', icon: Fire },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'featured', label: 'Featured', icon: Star },
]

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-4 h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-indigo-100' : ''
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : ''}`} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}