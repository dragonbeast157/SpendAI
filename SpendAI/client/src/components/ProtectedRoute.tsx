import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  console.log('=== PROTECTED ROUTE CHECK START ===');
  const { user, loading, checkOnboardingStatus } = useAuth()

  console.log('ProtectedRoute: Auth loading state:', loading);
  console.log('ProtectedRoute: Current user exists:', !!user);
  console.log('ProtectedRoute: User email:', user?.email);
  console.log('ProtectedRoute: User onboarding completed:', user?.onboardingCompleted);
  console.log('ProtectedRoute: Current pathname:', window.location.pathname);

  if (loading) {
    console.log('ProtectedRoute: Still loading, showing loading state');
    console.log('=== PROTECTED ROUTE CHECK END (LOADING) ===');
    return <div>Loading...</div>
  }

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    console.log('=== PROTECTED ROUTE CHECK END (NO USER) ===');
    return <Navigate to="/login" replace />
  }

  const needsOnboarding = checkOnboardingStatus()
  console.log('ProtectedRoute: checkOnboardingStatus result:', needsOnboarding);
  console.log('ProtectedRoute: User object for onboarding check:', {
    exists: !!user,
    onboardingCompleted: user?.onboardingCompleted,
    email: user?.email
  });

  if (needsOnboarding && window.location.pathname !== '/onboarding') {
    console.log('ProtectedRoute: User needs onboarding, redirecting to /onboarding');
    console.log('=== PROTECTED ROUTE CHECK END (NEEDS ONBOARDING) ===');
    return <Navigate to="/onboarding" replace />
  }

  if (!needsOnboarding && window.location.pathname === '/onboarding') {
    console.log('ProtectedRoute: User completed onboarding but on onboarding page, redirecting to dashboard');
    console.log('=== PROTECTED ROUTE CHECK END (REDIRECT TO DASHBOARD) ===');
    return <Navigate to="/" replace />
  }

  console.log('ProtectedRoute: All checks passed, rendering children');
  console.log('ProtectedRoute: About to render dashboard or other protected content');
  console.log('=== PROTECTED ROUTE CHECK END (RENDER CHILDREN) ===');
  return <>{children}</>
}