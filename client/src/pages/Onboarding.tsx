import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/contexts/AuthContext'
import { completeOnboarding } from '@/api/onboarding'

export function Onboarding() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 2

  console.log('=== ONBOARDING COMPONENT RENDER ===');
  console.log('Onboarding: Current step:', step);
  console.log('Onboarding: Current user:', user);
  console.log('Onboarding: User onboarding status:', user?.onboardingCompleted);
  console.log('=== END ONBOARDING COMPONENT RENDER ===');

  // Form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    goals: ''
  })

  const [preferences, setPreferences] = useState({
    notifications: {
      anomalies: true,
      policyViolations: true,
      dailySummary: true,
      weeklyReports: true,
      aiCoachTips: true,
      dealAlerts: true
    }
  })

  const handleNext = () => {
    console.log('=== ONBOARDING NEXT STEP ===');
    console.log('Onboarding: Moving from step', step, 'to step', step + 1);
    if (step < totalSteps) {
      setStep(step + 1)
    }
    console.log('=== END ONBOARDING NEXT STEP ===');
  }

  const handleBack = () => {
    console.log('=== ONBOARDING BACK STEP ===');
    console.log('Onboarding: Moving from step', step, 'to step', step - 1);
    if (step > 1) {
      setStep(step - 1)
    }
    console.log('=== END ONBOARDING BACK STEP ===');
  }

  const handleComplete = async () => {
    try {
      console.log('=== ONBOARDING COMPLETION START ===');
      console.log('Onboarding: Starting completion process');
      console.log('Onboarding: Current step before completion:', step);
      console.log('Onboarding: Profile data:', profile);
      console.log('Onboarding: Preferences data:', preferences);
      console.log('Onboarding: Current user before completion:', user);

      setLoading(true)
      console.log('Onboarding: Loading state set to true');

      console.log('Onboarding: About to call completeOnboarding API');
      const response = await completeOnboarding({
        profile,
        preferences
      })

      console.log('Onboarding: API response received:', response);
      console.log('Onboarding: Response success status:', response.success);

      if (response.success) {
        console.log('Onboarding: API call successful, about to refresh user data');
        
        // Show success toast first
        toast({
          title: "Welcome!",
          description: "Your account setup is complete.",
        })
        console.log('Onboarding: Success toast shown');

        console.log('Onboarding: About to call refreshUser()');
        await refreshUser()
        console.log('Onboarding: refreshUser() completed');

        console.log('Onboarding: About to navigate to dashboard');
        navigate('/')
        console.log('Onboarding: Navigation to dashboard initiated');
      } else {
        console.error('Onboarding: API call failed with response:', response);
        throw new Error(response.message || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('=== ONBOARDING COMPLETION ERROR ===');
      console.error('Onboarding: Error completing onboarding:', error);
      console.error('Onboarding: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Onboarding: Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Onboarding: Current step when error occurred:', step);
      console.error('=== END ONBOARDING COMPLETION ERROR ===');

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete setup",
        variant: "destructive",
      })
    } finally {
      console.log('Onboarding: Setting loading to false');
      setLoading(false)
      console.log('=== ONBOARDING COMPLETION END ===');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Welcome to SpendWise!</CardTitle>
              <CardDescription>Let's set up your account</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </div>
          </div>
          <Progress value={(step / totalSteps) * 100} className="w-full" />
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => {
                    console.log('Onboarding: Name field changed to:', e.target.value);
                    setProfile({ ...profile, name: e.target.value });
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="goals">Financial Goals (Optional)</Label>
                <Textarea
                  id="goals"
                  value={profile.goals}
                  onChange={(e) => {
                    console.log('Onboarding: Goals field changed to:', e.target.value);
                    setProfile({ ...profile, goals: e.target.value });
                  }}
                  placeholder="What are your main financial goals?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} disabled={!profile.name.trim()}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Spending Anomaly Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified of unusual spending</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.anomalies}
                      onCheckedChange={(checked) => {
                        console.log('Onboarding: Anomaly alerts preference changed to:', checked);
                        setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, anomalies: checked }
                        });
                      }}
                    />
                  </div>

                  {user?.accountType === 'business' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Policy Violation Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified of policy violations</p>
                      </div>
                      <Switch
                        checked={preferences.notifications.policyViolations}
                        onCheckedChange={(checked) => {
                          console.log('Onboarding: Policy violation alerts preference changed to:', checked);
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, policyViolations: checked }
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Summary</Label>
                      <p className="text-sm text-muted-foreground">Daily spending summary emails</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.dailySummary}
                      onCheckedChange={(checked) => {
                        console.log('Onboarding: Daily summary preference changed to:', checked);
                        setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, dailySummary: checked }
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly financial insights</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.weeklyReports}
                      onCheckedChange={(checked) => {
                        console.log('Onboarding: Weekly reports preference changed to:', checked);
                        setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, weeklyReports: checked }
                        });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Coach Tips</Label>
                      <p className="text-sm text-muted-foreground">Personalized financial advice</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.aiCoachTips}
                      onCheckedChange={(checked) => {
                        console.log('Onboarding: AI coach tips preference changed to:', checked);
                        setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, aiCoachTips: checked }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? 'Completing...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}