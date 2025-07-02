import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, deleteAccount as apiDeleteAccount } from '@/api/auth'
import { getCurrentUser } from '@/api/users'

interface User {
  _id: string
  email: string
  name: string
  accountType: 'personal' | 'business'
  onboardingCompleted: boolean
  companyName?: string
  companySize?: string
  industry?: string
  preferences?: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  deleteAccount: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext: Initializing authentication')
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        console.log('AuthContext: No access token found')
        setLoading(false)
        return
      }

      console.log('AuthContext: Access token found, fetching user data')
      const userData = await getCurrentUser()
      console.log('AuthContext: User data fetched:', userData)
      console.log('AuthContext: User onboarding status:', userData.onboardingCompleted)
      setUser(userData)
    } catch (error) {
      console.error('AuthContext: Error initializing auth:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login process for:', email)
      const response = await apiLogin(email, password)
      console.log('AuthContext: Login response received:', response)

      localStorage.setItem('accessToken', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      console.log('AuthContext: Tokens stored, fetching user data')
      const userData = await getCurrentUser()
      console.log('AuthContext: User data after login:', userData)
      console.log('AuthContext: User onboarding completed:', userData.onboardingCompleted)
      setUser(userData)
    } catch (error) {
      console.error('AuthContext: Login error:', error)
      throw error
    }
  }

  const logout = () => {
    console.log('AuthContext: Logging out user')
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    apiLogout()
  }

  const deleteAccount = async () => {
    try {
      await apiDeleteAccount()
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } catch (error) {
      console.error('AuthContext: Error deleting account:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      console.log('=== AUTH CONTEXT REFRESH USER START ===');
      console.log('AuthContext: Refreshing user data');
      console.log('AuthContext: Current user before refresh:', user);
      console.log('AuthContext: Current user onboarding status before refresh:', user?.onboardingCompleted);

      const userData = await getCurrentUser()
      
      console.log('AuthContext: Refreshed user data received:', userData);
      console.log('AuthContext: Refreshed user onboarding status:', userData.onboardingCompleted);
      console.log('AuthContext: About to set user state with refreshed data');
      
      setUser(userData)
      
      console.log('AuthContext: User state updated with refreshed data');
      console.log('=== AUTH CONTEXT REFRESH USER END ===');
    } catch (error) {
      console.error('=== AUTH CONTEXT REFRESH USER ERROR ===');
      console.error('AuthContext: Error refreshing user:', error);
      console.error('AuthContext: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('=== END AUTH CONTEXT REFRESH USER ERROR ===');
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, deleteAccount, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}