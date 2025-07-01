import React, { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from '@/api/auth'
import { getCurrentUser } from '@/api/users'

interface User {
  _id: string
  email: string
  name?: string
  accountType: 'personal' | 'business'
  onboardingCompleted?: boolean
  companyName?: string
  companySize?: string
  industry?: string
  preferences?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  checkOnboardingStatus: () => boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    console.log('=== AUTH CONTEXT REFRESH USER START ===');
    try {
      console.log('AuthContext: About to call getCurrentUser API');
      const userData = await getCurrentUser()
      console.log('AuthContext: getCurrentUser API completed');
      console.log('AuthContext: Raw API response:', userData);
      console.log('AuthContext: User data from API:', userData.user);
      console.log('AuthContext: Onboarding status from API:', userData.user?.onboardingCompleted);

      console.log('AuthContext: Setting user state...');
      setUser(userData.user)
      console.log('AuthContext: User state set completed');

      // Add a small delay to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('AuthContext: User state after delay should be updated');
    } catch (error) {
      console.error('AuthContext: Error refreshing user data:', error);
      console.error('AuthContext: Error details:', error?.response?.data || error.message);
    }
    console.log('=== AUTH CONTEXT REFRESH USER END ===');
  }

  useEffect(() => {
    const initAuth = async () => {
      console.log('AuthContext: Initializing authentication')
      const token = localStorage.getItem('accessToken')

      if (token) {
        console.log('AuthContext: Found access token, fetching user data')
        try {
          const userData = await getCurrentUser()
          console.log('AuthContext: User data fetched successfully')
          setUser(userData.user)
        } catch (error) {
          console.error('AuthContext: Error fetching user data:', error)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      } else {
        console.log('AuthContext: No access token found')
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  useEffect(() => {
    if (user) {
      console.log('AuthContext: Current user data:', {
        id: user._id,
        email: user.email,
        accountType: user.accountType,
        onboardingCompleted: user.onboardingCompleted
      });
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Starting login process for:', email)
    try {
      const response = await apiLogin(email, password)
      console.log('AuthContext: Login response received')

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken)
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken)
      }

      // Set user data from login response
      const userFromLogin = {
        _id: response._id,
        email: response.email,
        name: response.name,
        accountType: response.accountType,
        onboardingCompleted: response.onboardingCompleted,
        companyName: response.companyName,
        companySize: response.companySize,
        industry: response.industry,
        preferences: response.preferences
      };

      setUser(userFromLogin)
      console.log('AuthContext: User login successful');
    } catch (error) {
      console.error('AuthContext: Login error:', error)
      throw error
    }
  }

  const logout = () => {
    console.log('AuthContext: Logging out user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const checkOnboardingStatus = () => {
    const needsOnboarding = user && !user.onboardingCompleted
    console.log('AuthContext: checkOnboardingStatus called');
    console.log('AuthContext: User exists?', !!user);
    console.log('AuthContext: User onboarding completed?', user?.onboardingCompleted);
    console.log('AuthContext: Needs onboarding result:', needsOnboarding);
    return needsOnboarding || false
  }

  const value = {
    user,
    login,
    logout,
    loading,
    checkOnboardingStatus,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
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