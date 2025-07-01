import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, CheckCircle, Upload, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { 
  saveProfile, 
  savePreferences, 
  completeOnboarding 
} from '@/api/onboarding'

export function Onboarding() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Profile data
  const [profile, setProfile] = useState({
    name: user?.name || '',
    companyName: user?.companyName || '',
    companySize: user?.companySize || '',
    industry: user?.industry || '',
    financialGoal: ''
  })
  
  // Preferences data
  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    emailSummaries: true,
    weeklyReports: true,
    aiCoachTips: true,
    policyAlerts: user?.accountType === 'business'
  })

  // Determine total steps based on account type
  const totalSteps = user?.accountType === 'business' ? 3 : 3

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      if (currentStep === 1) {
        // Save profile data
        try {
          setLoading(true)
          await saveProfile(profile)
          toast({
            title: "Profile saved",
            description: "Your profile information has been saved successfully"
          })
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to save profile",
            variant: "destructive"
          })
          return
        } finally {
          setLoading(false)
        }
      }
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      await handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    console.log('=== ONBOARDING COMPLETION START ===');
    console.log('Onboarding: Starting completion process');
    console.log('Onboarding: Current user before completion:', user);
    console.log('Onboarding: User onboarding status before:', user?.onboardingCompleted);

    try {
      setLoading(true)

      console.log('Onboarding: Saving preferences...');
      console.log('Onboarding: Preferences data:', preferences);
      const preferencesResult = await savePreferences(preferences)
      console.log('Onboarding: Preferences API result:', preferencesResult);

      console.log('Onboarding: Calling completeOnboarding API...');
      const completionResult = await completeOnboarding()
      console.log('Onboarding: completeOnboarding API result:', completionResult);

      console.log('Onboarding: About to refresh user data...');
      console.log('Onboarding: User state before refresh:', user);
      await refreshUser()
      console.log('Onboarding: User data refresh completed');
      console.log('Onboarding: User state after refresh:', user);
      console.log('Onboarding: User onboarding status after refresh:', user?.onboardingCompleted);

      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Onboarding: User state after delay:', user);

      toast({
        title: "Welcome to SpendAI!",
        description: "Your account has been set up successfully"
      })

      console.log('Onboarding: About to navigate to dashboard');
      console.log('Onboarding: Current pathname before navigate:', window.location.pathname);
      
      // Force a small delay before navigation
      setTimeout(() => {
        console.log('Onboarding: Executing navigation to dashboard');
        navigate('/', { replace: true })
        console.log('Onboarding: Navigation command executed');
      }, 200);

    } catch (error) {
      console.error('=== ONBOARDING COMPLETION ERROR ===');
      console.error('Onboarding: Error during completion:', error);
      console.error('Onboarding: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('=== END ONBOARDING COMPLETION ERROR ===');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete onboarding",
        variant: "destructive"
      })
    } finally {
      console.log('Onboarding: Setting loading to false');
      setLoading(false)
      console.log('=== ONBOARDING COMPLETION END ===');
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>
                Help us personalize your SpendAI experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {user?.accountType === 'business' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Input
                        id="companySize"
                        value={profile.companySize}
                        onChange={(e) => setProfile({ ...profile, companySize: e.target.value })}
                        placeholder="e.g., 10-50 employees"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={profile.industry}
                        onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                        placeholder="e.g., Technology"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>What's your primary financial goal?</Label>
                <RadioGroup
                  value={profile.financialGoal}
                  onValueChange={(value) => setProfile({ ...profile, financialGoal: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="save-more" id="save-more" />
                    <Label htmlFor="save-more">Save more money</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reduce-spending" id="reduce-spending" />
                    <Label htmlFor="reduce-spending">Reduce spending</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="track-expenses" id="track-expenses" />
                    <Label htmlFor="track-expenses">Track expenses better</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pay-debt" id="pay-debt" />
                    <Label htmlFor="pay-debt">Pay off debt</Label>
                  </div>
                  {user?.accountType === 'business' && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="policy-compliance" id="policy-compliance" />
                      <Label htmlFor="policy-compliance">Monitor company policy compliance</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you'd like to receive updates and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pushNotifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, pushNotifications: checked as boolean })
                    }
                  />
                  <Label htmlFor="pushNotifications">Push notifications for spending alerts</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailSummaries"
                    checked={preferences.emailSummaries}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, emailSummaries: checked as boolean })
                    }
                  />
                  <Label htmlFor="emailSummaries">Daily email summaries</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="weeklyReports"
                    checked={preferences.weeklyReports}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, weeklyReports: checked as boolean })
                    }
                  />
                  <Label htmlFor="weeklyReports">Weekly insights reports</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aiCoachTips"
                    checked={preferences.aiCoachTips}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, aiCoachTips: checked as boolean })
                    }
                  />
                  <Label htmlFor="aiCoachTips">AI coach tips</Label>
                </div>

                {user?.accountType === 'business' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="policyAlerts"
                      checked={preferences.policyAlerts}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, policyAlerts: checked as boolean })
                      }
                    />
                    <Label htmlFor="policyAlerts">Policy violation alerts</Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>You're all set!</CardTitle>
              <CardDescription>
                {user?.accountType === 'business' 
                  ? "Your business account is ready. You can upload your company policy later from the Policy Management page."
                  : "Your personal account is ready to help you manage your finances."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Welcome to SpendAI!</h3>
                <p className="text-muted-foreground">
                  Your account has been configured successfully.
                </p>
              </div>

              {user?.accountType === 'business' && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Next Steps for Business Users
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        Visit the Policy Management page to upload your company spending policy and enable compliance monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">What you can do now:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Connect your bank accounts</li>
                  <li>• Upload bank statements</li>
                  <li>• Start tracking your expenses</li>
                  <li>• Get AI-powered insights</li>
                  {user?.accountType === 'business' && (
                    <li>• Upload your company policy for compliance monitoring</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Setup Your Account</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading || (currentStep === 1 && !profile.name)}
          >
            {loading ? (
              "Processing..."
            ) : currentStep === totalSteps ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}