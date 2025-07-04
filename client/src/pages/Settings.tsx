import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Settings as SettingsIcon,
  Bell,
  CreditCard,
  User,
  Building2,
  Download,
  Trash2,
  Shield,
  Palette,
  Save,
  Plus
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getConnectedAccounts,
  disconnectAccount,
  getSpendingCategories,
  updateSpendingCategory,
  exportUserData,
  switchAccountType,
  updateProfile
} from '@/api/settings'
import { getCurrentUser } from '@/api/users'
import { deleteAccount } from '@/api/auth'
import { getSupportedBanks } from '@/api/banking'
import { ExportButton } from '@/components/ExportButton'
import { BankSelectionModal } from '@/components/banking/BankSelectionModal'
import { BankAuthModal } from '@/components/banking/BankAuthModal'

export function Settings() {
  const { user, logout, refreshUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [preferences, setPreferences] = useState<any>({})
  const [localPreferences, setLocalPreferences] = useState<any>({}) // Local state for unsaved changes
  const [preferencesChanged, setPreferencesChanged] = useState(false) // Track if changes are unsaved
  const [savingPreferences, setSavingPreferences] = useState(false) // Loading state for save button
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    companyName: '',
    companySize: '',
    industry: ''
  })

  // Bank connection states
  const [supportedBanks, setSupportedBanks] = useState<any[]>([])
  const [showBankModal, setShowBankModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState<any>(null)
  const [loadingBanks, setLoadingBanks] = useState(false)

  useEffect(() => {
    loadSettingsData()
    loadSupportedBanks()
  }, [])

  const loadSupportedBanks = async () => {
    try {
      setLoadingBanks(true)
      console.log('Settings: Loading supported banks...')
      const response = await getSupportedBanks()
      setSupportedBanks(response.banks || [])
      console.log('Settings: Supported banks loaded:', response.banks?.length || 0)
    } catch (error) {
      console.error('Settings: Error loading supported banks:', error)
      toast({
        title: "Error loading banks",
        description: error instanceof Error ? error.message : "Failed to load supported banks",
        variant: "destructive",
      })
    } finally {
      setLoadingBanks(false)
    }
  }

  const loadSettingsData = async () => {
    try {
      setLoading(true)
      console.log('Settings: Loading settings data...')

      const [
        userProfileData,
        preferencesData,
        accountsData,
        categoriesData
      ] = await Promise.all([
        getCurrentUser(),
        getNotificationPreferences(),
        getConnectedAccounts(),
        getSpendingCategories()
      ])

      console.log('Settings: User profile data loaded:', userProfileData)
      console.log('Settings: Notification preferences loaded:', preferencesData)
      console.log('Settings: Connected accounts loaded:', accountsData)

      setUserProfile(userProfileData)
      const loadedPreferences = preferencesData.notifications || {}
      setPreferences(loadedPreferences)
      setLocalPreferences(loadedPreferences) // Initialize local preferences
      setPreferencesChanged(false) // Reset changed state
      setConnectedAccounts(accountsData.accounts || [])
      setCategories(categoriesData.categories)

      // Initialize profile form
      setProfileForm({
        name: userProfileData.name || '',
        email: userProfileData.email || '',
        companyName: userProfileData.companyName || '',
        companySize: userProfileData.companySize || '',
        industry: userProfileData.industry || ''
      })

      console.log('Settings: All settings data loaded successfully')
    } catch (error) {
      console.error('Settings: Error loading settings data:', error)
      toast({
        title: "Error loading settings",
        description: error instanceof Error ? error.message : "Failed to load settings data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      console.log('Settings: Updating profile with data:', profileForm)
      await updateProfile(profileForm)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      await refreshUser()
      console.log('Settings: Profile updated successfully')
    } catch (error) {
      console.error('Settings: Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  const handleLocalPreferenceChange = (key: string, value: boolean) => {
    console.log('Settings: Local preference change:', key, value)
    const newLocalPreferences = { ...localPreferences, [key]: value }
    setLocalPreferences(newLocalPreferences)

    // Check if local preferences differ from saved preferences
    const hasChanges = Object.keys(newLocalPreferences).some(
      key => newLocalPreferences[key] !== preferences[key]
    )
    setPreferencesChanged(hasChanges)
    console.log('Settings: Preferences changed:', hasChanges)
  }

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true)
      console.log('Settings: Saving notification preferences:', localPreferences)

      const response = await updateNotificationPreferences(localPreferences)
      setPreferences(response.notifications || localPreferences)
      setPreferencesChanged(false) // Reset changed state after successful save

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been saved successfully",
      })
      console.log('Settings: Notification preferences saved successfully')
    } catch (error) {
      console.error('Settings: Error saving preferences:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences",
        variant: "destructive",
      })
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleResetPreferences = () => {
    console.log('Settings: Resetting preferences to saved state')
    setLocalPreferences(preferences)
    setPreferencesChanged(false)
  }

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      console.log('Settings: Disconnecting account:', accountId)
      await disconnectAccount(accountId)
      setConnectedAccounts(prev => prev.filter(acc => acc._id !== accountId))
      toast({
        title: "Account disconnected",
        description: "Bank account has been disconnected successfully",
      })
      console.log('Settings: Account disconnected successfully')
    } catch (error) {
      console.error('Settings: Error disconnecting account:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect account",
        variant: "destructive",
      })
    }
  }

  const handleSelectBank = (bankId: string) => {
    console.log('Settings: Bank ID selected:', bankId)
    
    // Find the full bank object from supported banks
    const bank = supportedBanks.find(b => b._id === bankId)
    console.log('Settings: Bank object found:', bank)

    if (!bank) {
      console.error('Settings: Bank selection failed - bank not found for ID:', bankId)
      toast({
        title: "Selection Error",
        description: "Failed to find selected bank. Please try again.",
        variant: "destructive",
      })
      return
    }

    setSelectedBank(bank)
    setShowBankModal(false)
    setShowAuthModal(true)
  }

  const handleBankConnectionSuccess = async () => {
    console.log('Settings: Bank connection successful, refreshing accounts')
    await loadSettingsData() // Refresh the connected accounts
    setShowAuthModal(false)
    setSelectedBank(null)
  }

  const handleSwitchAccountType = async (newType: 'personal' | 'business') => {
    try {
      console.log('Settings: Switching account type to:', newType)
      await switchAccountType(newType)
      toast({
        title: "Account type updated",
        description: `Account type switched to ${newType}`,
      })
      await refreshUser()
      console.log('Settings: Account type switched successfully to:', newType)
    } catch (error) {
      console.error('Settings: Error switching account type:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to switch account type",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount()
      toast({
        title: "Account deleted",
        description: "Your account has been deleted successfully",
      })
      logout()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="banking" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Banking
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>

              {user?.accountType === 'business' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size</Label>
                      <Select
                        value={profileForm.companySize}
                        onValueChange={(value) => setProfileForm(prev => ({ ...prev, companySize: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
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

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={profileForm.industry}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g., Technology"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleUpdateProfile} className="w-full">
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Type Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Account Type
              </CardTitle>
              <CardDescription>Switch between personal and business account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Current Account Type</span>
                <Badge variant={user?.accountType === 'business' ? 'default' : 'secondary'}>
                  {user?.accountType === 'business' ? 'Business' : 'Personal'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button
                  variant={user?.accountType === 'personal' ? 'default' : 'outline'}
                  onClick={() => user?.accountType !== 'personal' && handleSwitchAccountType('personal')}
                  className="w-full justify-start"
                  disabled={user?.accountType === 'personal'}
                >
                  <User className="h-4 w-4 mr-2" />
                  Personal Account
                </Button>

                <Button
                  variant={user?.accountType === 'business' ? 'default' : 'outline'}
                  onClick={() => user?.accountType !== 'business' && handleSwitchAccountType('business')}
                  className="w-full justify-start"
                  disabled={user?.accountType === 'business'}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Business Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
                {preferencesChanged && (
                  <span className="text-orange-600 dark:text-orange-400 ml-2">
                    • Unsaved changes
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anomalies">Anomaly Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for unusual spending patterns</p>
                </div>
                <Switch
                  id="anomalies"
                  checked={localPreferences.anomalies || false}
                  onCheckedChange={(checked) => handleLocalPreferenceChange('anomalies', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dailySummary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Daily email summaries of your spending</p>
                </div>
                <Switch
                  id="dailySummary"
                  checked={localPreferences.dailySummary || false}
                  onCheckedChange={(checked) => handleLocalPreferenceChange('dailySummary', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weeklyReports">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Weekly insights and spending reports</p>
                </div>
                <Switch
                  id="weeklyReports"
                  checked={localPreferences.weeklyReports || false}
                  onCheckedChange={(checked) => handleLocalPreferenceChange('weeklyReports', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="aiCoachTips">AI Coach Tips</Label>
                  <p className="text-sm text-muted-foreground">Personalized financial advice and tips</p>
                </div>
                <Switch
                  id="aiCoachTips"
                  checked={localPreferences.aiCoachTips || false}
                  onCheckedChange={(checked) => handleLocalPreferenceChange('aiCoachTips', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dealAlerts">Deal Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notifications about savings opportunities</p>
                </div>
                <Switch
                  id="dealAlerts"
                  checked={localPreferences.dealAlerts || false}
                  onCheckedChange={(checked) => handleLocalPreferenceChange('dealAlerts', checked)}
                />
              </div>

              {user?.accountType === 'business' && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="policyViolations">Policy Violations</Label>
                    <p className="text-sm text-muted-foreground">Notifications for policy violations</p>
                  </div>
                  <Switch
                    id="policyViolations"
                    checked={localPreferences.policyViolations || false}
                    onCheckedChange={(checked) => handleLocalPreferenceChange('policyViolations', checked)}
                  />
                </div>
              )}

              {/* Save/Reset buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSavePreferences}
                  disabled={!preferencesChanged || savingPreferences}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingPreferences ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResetPreferences}
                  disabled={!preferencesChanged}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking" className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Connected Accounts
                  </CardTitle>
                  <CardDescription>Manage your connected bank accounts</CardDescription>
                </div>
                <Button onClick={() => setShowBankModal(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bank Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connectedAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No connected accounts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your bank account to automatically import transactions
                  </p>
                  <Button onClick={() => setShowBankModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Connect Your First Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectedAccounts.map((account) => (
                    <div key={account._id} className="flex items-center justify-between p-4 border rounded-lg bg-white/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.bankName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{account.accountType}</span>
                            <span>•</span>
                            <span>Last sync: {new Date(account.lastSync).toLocaleDateString()}</span>
                            <Badge variant={account.isConnected ? "default" : "secondary"} className="ml-2">
                              {account.isConnected ? "Connected" : "Disconnected"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="font-semibold">${account.balance?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-muted-foreground">Balance</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnectAccount(account._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>Export your data or delete your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <ExportButton format="json" />
                <ExportButton format="csv" />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bank Selection Modal */}
      <BankSelectionModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        banks={supportedBanks}
        onConnect={handleSelectBank}
      />

      {/* Bank Authentication Modal */}
      <BankAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        selectedBank={selectedBank}
        onSuccess={handleBankConnectionSuccess}
      />
    </div>
  )
}