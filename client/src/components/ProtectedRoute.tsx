import { useAuth } from '@/contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  console.log('=== PROTECTED ROUTE CHECK START ===');
  
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute: Auth loading state:', loading);
  console.log('ProtectedRoute: Current user exists:', !!user);
  console.log('ProtectedRoute: User email:', user?.email);
  console.log('ProtectedRoute: User onboarding completed:', user?.onboardingCompleted);
  console.log('ProtectedRoute: Current pathname:', location.pathname);

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    console.log('=== PROTECTED ROUTE CHECK END (LOADING) ===');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    console.log('=== PROTECTED ROUTE CHECK END (NO USER) ===');
    return <Navigate to="/login" replace />
  }

  // Check if user has completed onboarding
  if (!user.onboardingCompleted && location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: User has not completed onboarding, redirecting to onboarding');
    console.log('=== PROTECTED ROUTE CHECK END (ONBOARDING REQUIRED) ===');
    return <Navigate to="/onboarding" replace />
  }

  // If user has completed onboarding but is on onboarding page, redirect to dashboard
  if (user.onboardingCompleted && location.pathname === '/onboarding') {
    console.log('ProtectedRoute: User has completed onboarding but is on onboarding page, redirecting to dashboard');
    console.log('=== PROTECTED ROUTE CHECK END (REDIRECT TO DASHBOARD) ===');
    return <Navigate to="/" replace />
  }

  console.log('ProtectedRoute: All checks passed, rendering children');
  console.log('=== PROTECTED ROUTE CHECK END (SUCCESS) ===');
  
  return <>{children}</>
}