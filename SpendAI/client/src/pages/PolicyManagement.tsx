import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Building2,
  Trash2,
  Download,
  Plus
} from 'lucide-react'
import {
  getPolicyOverview,
  getPolicyViolations,
  getPolicies,
  uploadPolicyDocument,
  deletePolicy,
  createPolicy
} from '@/api/policy'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'

export function PolicyManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [policies, setPolicies] = useState<any[]>([])
  const [overview, setOverview] = useState<any>(null)
  const [violations, setViolations] = useState<any[]>([])
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [policyTitle, setPolicyTitle] = useState('')
  const [policyDescription, setPolicyDescription] = useState('')

  useEffect(() => {
    if (user?.accountType === 'business') {
      loadPolicyData()
    }
  }, [user])

  const loadPolicyData = async () => {
    try {
      setLoading(true)
      const [overviewData, violationsData, policiesData] = await Promise.all([
        getPolicyOverview(),
        getPolicyViolations(),
        getPolicies()
      ])
      
      setOverview(overviewData.policy)
      setViolations(violationsData.violations)
      setPolicies(policiesData.policies)
    } catch (error) {
      console.error('Error loading policy data:', error)
      toast({
        title: "Error",
        description: "Failed to load policy data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('PolicyManagement: File selected:', file.name, file.type, file.size)
      setSelectedFile(file)
    }
  }

  const handleUploadPolicy = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a policy document to upload",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('PolicyManagement: Starting policy upload...')
      setUploading(true)
      setUploadProgress(0)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadPolicyDocument(
        selectedFile,
        policyTitle || 'Company Policy',
        policyDescription || 'Uploaded policy document'
      )

      clearInterval(progressInterval)
      setUploadProgress(100)

      console.log('PolicyManagement: Policy upload completed:', result)

      toast({
        title: "Success",
        description: "Policy document uploaded and processed successfully",
      })

      // Reset form
      setSelectedFile(null)
      setPolicyTitle('')
      setPolicyDescription('')
      setShowUploadDialog(false)
      setUploadProgress(0)

      // Reload policy data
      await loadPolicyData()
    } catch (error) {
      console.error('PolicyManagement: Upload error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload policy document",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    try {
      await deletePolicy(policyId)
      toast({
        title: "Success",
        description: "Policy deleted successfully",
      })
      await loadPolicyData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete policy",
        variant: "destructive",
      })
    }
  }

  if (user?.accountType !== 'business') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Business Account Required</h3>
          <p className="text-muted-foreground">
            Policy management is only available for business accounts.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
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
            Policy Management
          </h1>
          <p className="text-muted-foreground">Manage your company spending policies</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Policy Document</DialogTitle>
              <DialogDescription>
                Upload a PDF, DOC, or DOCX file containing your company spending policy
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Policy Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Company Spending Policy 2024"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the policy..."
                  value={policyDescription}
                  onChange={(e) => setPolicyDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Policy Document</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  disabled={uploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadPolicy}
                  disabled={!selectedFile || uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload Policy'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policy Overview */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Policy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Daily Spending Limits</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Dining:</span>
                    <span>${overview.dailyLimits?.dining || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport:</span>
                    <span>${overview.dailyLimits?.transport || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entertainment:</span>
                    <span>${overview.dailyLimits?.entertainment || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shopping:</span>
                    <span>${overview.dailyLimits?.shopping || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Compliance Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={overview.overallCompliance >= 90 ? "default" : "destructive"}>
                      {overview.overallCompliance}% Compliant
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {overview.violationsThisMonth} violations this month
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {overview.pendingApprovals} pending approvals
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Active Policies</CardTitle>
          <CardDescription>
            Currently active spending policies for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Policies Found</h3>
              <p className="text-muted-foreground mb-4">
                Upload a policy document to get started with spending compliance monitoring.
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Policy
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{policy.title}</h4>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Effective: {new Date(policy.effectiveDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                        {policy.status}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{policy.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePolicy(policy._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Policy
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {policy.dailyLimits && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-sm font-medium mb-2">Daily Limits:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <span>Dining: ${policy.dailyLimits.dining}</span>
                        <span>Transport: ${policy.dailyLimits.transport}</span>
                        <span>Entertainment: ${policy.dailyLimits.entertainment}</span>
                        <span>Shopping: ${policy.dailyLimits.shopping}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Violations */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Policy Violations
            </CardTitle>
            <CardDescription>
              Recent policy violations requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {violations.map((violation) => (
                <div key={violation._id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{violation.merchant}</h4>
                      <p className="text-sm text-muted-foreground">{violation.ruleViolated}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(violation.date).toLocaleDateString()} • ${violation.amount}
                      </p>
                    </div>
                    <Badge variant={
                      violation.severity === 'Critical' ? 'destructive' :
                      violation.severity === 'Major' ? 'default' : 'secondary'
                    }>
                      {violation.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}