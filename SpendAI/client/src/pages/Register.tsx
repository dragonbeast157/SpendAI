import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Eye, EyeOff, Wallet, Mail, Lock, User, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { register } from '@/api/auth'

type RegisterForm = {
  email: string
  password: string
  confirmPassword: string
  name: string
  accountType: 'personal' | 'business'
  companyName: string
  companySize: string
  industry: string
}

export function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    accountType: 'personal',
    companyName: '',
    companySize: '',
    industry: ''
  })

  // Add this logging when component mounts
  useEffect(() => {
    console.log('=== REGISTER COMPONENT MOUNTED ===');
    console.log('Register: Component initialized');
    console.log('Register: Current URL:', window.location.href);
    console.log('Register: Initial form state:', {
      ...formData,
      password: '[HIDDEN]',
      confirmPassword: '[HIDDEN]'
    });
    console.log('=== END REGISTER COMPONENT MOUNTED ===');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== REGISTRATION PROCESS START ===');
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Register: Starting registration process');
      console.log('Register: Form data:', { email: formData.email, accountType: formData.accountType });
      
      const response = await register(formData)
      console.log('Register: Registration API response received');
      console.log('Register: Registration response:', response);
      console.log('Register: Response keys:', Object.keys(response || {}));
      
      // Check if response contains auth tokens
      if (response.accessToken) {
        console.log('Register: Access token found in response, storing in localStorage');
        localStorage.setItem('accessToken', response.accessToken)
        
        if (response.refreshToken) {
          console.log('Register: Refresh token found, storing in localStorage');
          localStorage.setItem('refreshToken', response.refreshToken)
        }
        
        console.log('Register: Tokens stored, should auto-login now');
      } else {
        console.log('Register: No access token in response, user will need to login manually');
      }

      toast({
        title: "Account created successfully!",
        description: "Welcome to SpendAI"
      })

      console.log('Register: About to navigate to onboarding or dashboard');
      console.log('Register: Navigation target: /onboarding');
      navigate('/onboarding')
      console.log('Register: Navigation initiated');
    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Register: Registration failed:', error);
      console.error('Register: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('=== END REGISTRATION ERROR ===');
      
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      console.log('Register: Setting loading to false');
      setLoading(false)
      console.log('=== REGISTRATION PROCESS END ===');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-lg border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Your Account
          </CardTitle>
          <p className="text-gray-600">Join SpendWise and take control of your finances</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-12"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Password must be at least 6 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Type</h3>

              <RadioGroup
                value={formData.accountType}
                onValueChange={(value) => {
                  setFormData({ ...formData, accountType: value as 'personal' | 'business' });
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'personal' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <RadioGroupItem value="personal" id="personal" />
                  <div className="flex items-center space-x-3 flex-1">
                    <User className="h-6 w-6 text-green-500" />
                    <div>
                      <Label htmlFor="personal" className="text-base font-medium cursor-pointer">Personal Account</Label>
                      <p className="text-sm text-gray-600">Track personal spending and savings goals</p>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.accountType === 'business' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <RadioGroupItem value="business" id="business" />
                  <div className="flex items-center space-x-3 flex-1">
                    <Building2 className="h-6 w-6 text-blue-500" />
                    <div>
                      <Label htmlFor="business" className="text-base font-medium cursor-pointer">Business Account</Label>
                      <p className="text-sm text-gray-600">Monitor company expenses and policy compliance</p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Business Information (shown only for business accounts) */}
            {formData.accountType === 'business' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Enter company name"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">201-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    type="text"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}