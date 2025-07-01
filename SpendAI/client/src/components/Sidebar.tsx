import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Building2, 
  AlertTriangle, 
  Bot, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: CreditCard },
  { name: 'Policy', href: '/policy', icon: Building2, businessOnly: true },
  { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
  { name: 'AI Coach', href: '/ai-coach', icon: Bot },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  console.log('Sidebar: Current user data:', user)
  console.log('Sidebar: User account type:', user?.accountType)

  const isBusinessAccount = user?.accountType === 'business'
  console.log('Sidebar: Is business account?', isBusinessAccount)
  
  const filteredNavigation = navigation.filter(item =>
    !item.businessOnly || (item.businessOnly && isBusinessAccount)
  )

  console.log('Sidebar: Filtered navigation items:', filteredNavigation.map(item => item.name))

  return (
    <div className={cn(
      "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SpendWise
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        {collapsed && (
          <div className="flex justify-center mt-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Account Type Badge */}
      {!collapsed && (
        <div className="px-6 py-3">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium text-center",
            isBusinessAccount 
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          )}>
            {isBusinessAccount ? 'Business Account' : 'Personal Account'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )
            }
          >
            <item.icon className={cn("flex-shrink-0 h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
            {!collapsed && item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}