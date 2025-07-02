import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Building2,
  Mic,
  Play,
  Pause,
  Edit,
  Search,
  Share,
  FileText,
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import {
  getTransactionById,
  addVoiceNote,
  updateTransactionCategory,
  markAnomalyAsNormal,
  deleteTransaction
} from '@/api/transactions'

export function TransactionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [justification, setJustification] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadTransaction(id)
    }
  }, [id])

  const loadTransaction = async (transactionId: string) => {
    try {
      setLoading(true)
      const response = await getTransactionById(transactionId) as any
      setTransaction(response.transaction)
      setSelectedCategory(response.transaction.category)
    } catch (error: any) {
      toast({
        title: 'Error loading transaction',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddVoiceNote = async () => {
    try {
      setIsRecording(true)
      // Simulate recording
      setTimeout(async () => {
        setIsRecording(false)
        await addVoiceNote(id!, { audioData: 'mock-audio-data', transcript: 'This was a business lunch with client' })
        toast({
          title: 'Voice note added',
          description: 'Your note has been saved successfully'
        })
        if (id) loadTransaction(id)
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      setIsRecording(false)
    }
  }

  const handleCategoryUpdate = async () => {
    try {
      await updateTransactionCategory(id!, selectedCategory)
      toast({
        title: 'Category updated',
        description: 'Transaction category has been updated'
      })
      if (id) loadTransaction(id)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleMarkAsNormal = async () => {
    try {
      await markAnomalyAsNormal(id!)
      toast({
        title: 'Marked as normal',
        description: 'This transaction will no longer be flagged as anomalous'
      })
      if (id) loadTransaction(id)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTransaction = async () => {
    try {
      setIsDeleting(true)
      await deleteTransaction(id!)
      toast({
        title: 'Transaction deleted',
        description: 'Transaction deleted successfully'
      })
      navigate('/transactions')
    } catch (error: any) {
      toast({
        title: 'Error deleting transaction',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getPolicyStatusBadge = (status?: string) => {
    switch (status) {
      case 'compliant':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Compliant
          </Badge>
        )
      case 'warning':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Needs Review
          </Badge>
        )
      case 'violation':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Policy Violation
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Transaction not found</p>
        <Button onClick={() => navigate('/transactions')} className="mt-4">
          Back to Transactions
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/transactions')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{transaction.merchant}</h1>
            <p className="text-gray-600">Transaction Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getPolicyStatusBadge(transaction.policyStatus)}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center space-x-1">
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTransaction}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Transaction'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Transaction Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium">
                  {transaction.merchant.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{transaction.merchant}</h3>
                  <p className="text-sm text-gray-500">{transaction.location}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Amount</Label>
                  <p className={cn(
                    "text-2xl font-bold",
                    transaction.amount < 0 ? "text-red-600" : "text-green-600"
                  )}>
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Date & Time</Label>
                  <p className="font-semibold">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Category</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dining">Dining</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="groceries">Groceries</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedCategory !== transaction.category && (
                    <Button onClick={handleCategoryUpdate} size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Update
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                  {transaction.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Compliance Section */}
          {transaction.policyStatus && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Policy Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transaction.policyStatus === 'compliant' && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">✓ Compliant with company policy</p>
                      <p className="text-sm text-green-700 mt-1">{transaction.policyRule}</p>
                    </div>
                  </div>
                )}

                {transaction.policyStatus === 'violation' && (
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Policy violation detected</p>
                        <p className="text-sm text-red-700 mt-1">{transaction.policyRule}</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="justification">Business Justification</Label>
                      <Textarea
                        id="justification"
                        placeholder="Explain why this expense was necessary for business purposes..."
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                      <Button className="mt-2" disabled={!justification.trim()}>
                        Submit for Manager Review
                      </Button>
                    </div>
                  </div>
                )}

                {transaction.policyStatus === 'warning' && (
                  <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Policy review needed</p>
                      <p className="text-sm text-yellow-700 mt-1">{transaction.policyRule}</p>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline">Mark as Compliant</Button>
                        <Button size="sm" variant="outline">Report Violation</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Anomaly Section */}
          {transaction.hasAnomaly && (
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Spending Anomaly</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-800">Why this seems unusual</p>
                    <p className="text-sm text-orange-700 mt-1">{transaction.anomalyReason}</p>
                    <p className="text-sm text-orange-600 mt-2">{transaction.anomalyComparison}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleMarkAsNormal} variant="outline" size="sm">
                      Mark as Normal
                    </Button>
                    <Button variant="outline" size="sm">
                      This is OK
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Voice Note Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Voice Note</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!transaction.hasNote ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Tap to record your thoughts about this purchase
                  </p>
                  <Button
                    onClick={handleAddVoiceNote}
                    disabled={isRecording}
                    className="w-full"
                  >
                    {isRecording ? (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Add Voice Note
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Play className="h-3 w-3" />
                    </Button>
                    <div className="flex-1 h-8 bg-blue-100 rounded relative">
                      <div className="h-full bg-blue-500 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    This was a business lunch with our potential client to discuss the new contract terms.
                  </div>
                  <p className="text-xs text-gray-500">Recorded 2 hours ago</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Find Better Deals
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share className="h-4 w-4 mr-2" />
                Share Transaction
              </Button>
              {transaction.policyStatus === 'violation' && (
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Request Policy Exception
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}