import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Plus,
  Upload,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  Trash2,
  Eye
} from 'lucide-react'
import { getTransactions, createTransaction, deleteTransaction, type Transaction } from '@/api/transactions'
import { uploadBankStatement } from '@/api/banking'
import { UploadStatementModal } from '@/components/banking/UploadStatementModal'
import { useToast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'

export function TransactionManagement() {
  console.log('TransactionManagement: Component rendered')

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  console.log('TransactionManagement: Current state - showUploadModal:', showUploadModal)

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    merchant: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    transactionType: 'expense' // Add transaction type field
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  // Add effect to track showUploadModal state changes
  useEffect(() => {
    console.log("TransactionManagement: showUploadModal state changed to:", showUploadModal)
    if (showUploadModal) {
      console.log("TransactionManagement: Upload modal should now be visible!")
    } else {
      console.log("TransactionManagement: Upload modal should now be hidden!")
    }
  }, [showUploadModal])

  const loadTransactions = async () => {
    try {
      console.log('TransactionManagement: Loading transactions...')
      setLoading(true)
      const response = await getTransactions()
      const result = response as any
      setTransactions(result.transactions || [])
      console.log('TransactionManagement: Loaded', result.transactions?.length || 0, 'transactions')
    } catch (error) {
      console.error('TransactionManagement: Error loading transactions:', error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('TransactionManagement: Creating transaction:', newTransaction)
      
      // Calculate the final amount based on transaction type
      let finalAmount = parseFloat(newTransaction.amount)
      if (newTransaction.transactionType === 'expense') {
        finalAmount = Math.abs(finalAmount) * -1 // Ensure expense is negative
      } else {
        finalAmount = Math.abs(finalAmount) // Ensure income is positive
      }
      
      console.log('TransactionManagement: Final amount after type adjustment:', finalAmount)
      
      await createTransaction({
        ...newTransaction,
        amount: finalAmount
      })
      toast({
        title: "Success",
        description: "Transaction created successfully",
      })
      setShowCreateModal(false)
      setNewTransaction({
        amount: '',
        merchant: '',
        description: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        transactionType: 'expense'
      })
      loadTransactions()
    } catch (error) {
      console.error('TransactionManagement: Error creating transaction:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create transaction",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      console.log('TransactionManagement: Deleting transaction:', transactionId)
      setDeletingTransactionId(transactionId)
      await deleteTransaction(transactionId)
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
      loadTransactions()
    } catch (error) {
      console.error('TransactionManagement: Error deleting transaction:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete transaction",
        variant: "destructive",
      })
    } finally {
      setDeletingTransactionId(null)
    }
  }

  const handleUploadStatement = async (file: File) => {
    try {
      console.log("TransactionManagement: handleUploadStatement called with file:", file.name)
      console.log("TransactionManagement: File size:", file.size, "bytes")
      console.log("TransactionManagement: File type:", file.type)
      console.log("TransactionManagement: Starting upload process...")

      const response = await uploadBankStatement(file)
      console.log("TransactionManagement: Raw API response:", response)
      console.log("TransactionManagement: Response type:", typeof response)
      console.log("TransactionManagement: Response keys:", Object.keys(response || {}))

      const result = response as any
      console.log("TransactionManagement: Processed result:", result)
      console.log("TransactionManagement: result.success:", result.success)
      console.log("TransactionManagement: result.transactionCount:", result.transactionCount)
      console.log("TransactionManagement: result.message:", result.message)

      console.log("TransactionManagement: Upload completed successfully:", result)

      // Show success toast with detailed logging
      const transactionCount = result.transactionCount || result.transactions?.length || 0
      console.log("TransactionManagement: Calculated transaction count:", transactionCount)

      const successMessage = `Statement uploaded successfully. ${transactionCount} transactions found.`
      console.log("TransactionManagement: Success message to display:", successMessage)

      toast({
        title: "Success",
        description: successMessage,
      })
      console.log("TransactionManagement: Success toast should have been displayed")

      // Refresh transactions after upload
      console.log("TransactionManagement: Refreshing transaction data...")
      loadTransactions()
    } catch (error) {
      console.error("TransactionManagement: Upload error:", error)
      console.log("TransactionManagement: Error message:", error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      })
      console.log("TransactionManagement: Error toast should have been displayed")
    }
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return Math.abs(b.amount) - Math.abs(a.amount)
        case 'merchant':
          return a.merchant.localeCompare(b.merchant)
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

  const totalSpent = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      {console.log("TransactionManagement: About to render, showUploadModal:", showUploadModal)}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transaction Management
          </h1>
          <p className="text-muted-foreground">Manage your financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            console.log("TransactionManagement: Upload Statement button clicked")
            setShowUploadModal(true)
          }}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredTransactions.length} filtered
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="dining">Dining</SelectItem>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="amount">Amount (Highest)</SelectItem>
                <SelectItem value="merchant">Merchant (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>Your recent financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload a bank statement or add transactions manually to get started'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Statement
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => {
                console.log('TransactionManagement: Rendering transaction:', {
                  id: transaction._id,
                  merchant: transaction.merchant,
                  amount: transaction.amount,
                  hasAnomaly: transaction.hasAnomaly,
                  isAnomaly: transaction.isAnomaly,
                  anomalyReason: transaction.anomalyReason,
                  policyStatus: transaction.policyStatus,
                  policyRule: transaction.policyRule
                });

                return (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.amount < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{transaction.merchant}</h4>
                          <Badge variant="secondary">{transaction.category}</Badge>
                          {(transaction.isAnomaly || transaction.hasAnomaly) && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Anomaly
                            </Badge>
                          )}
                          {transaction.policyStatus && transaction.policyStatus !== 'compliant' && (
                            <Badge variant={transaction.policyStatus === 'violation' ? 'destructive' : 'default'} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {transaction.policyStatus === 'violation' ? 'Policy Violation' : 'Policy Warning'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        {(transaction.anomalyReason || transaction.policyRule) && (
                          <p className="text-xs text-amber-600 mt-1">
                            {transaction.anomalyReason || transaction.policyRule}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/transactions/${transaction._id}`)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={deletingTransactionId === transaction._id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the transaction for "{transaction.merchant}"
                              with amount ${Math.abs(transaction.amount).toFixed(2)}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransaction(transaction._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Transaction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${
                          transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Transaction Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Manually add a transaction to your records
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTransaction} className="space-y-4">
            {/* Transaction Type Selection */}
            <div className="space-y-3">
              <Label>Transaction Type</Label>
              <RadioGroup
                value={newTransaction.transactionType}
                onValueChange={(value) => setNewTransaction(prev => ({ ...prev, transactionType: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="flex items-center gap-2 cursor-pointer">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span>Expense (Money Out)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="flex items-center gap-2 cursor-pointer">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Income (Money In)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount {newTransaction.transactionType === 'expense' ? '(will be deducted)' : '(will be added)'}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {newTransaction.transactionType === 'expense' 
                    ? 'Enter the amount you spent (will show as negative)' 
                    : 'Enter the amount you received (will show as positive)'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant">
                {newTransaction.transactionType === 'expense' ? 'Merchant/Vendor' : 'Source'}
              </Label>
              <Input
                id="merchant"
                placeholder={newTransaction.transactionType === 'expense' ? 'e.g., Starbucks, Amazon' : 'e.g., Salary, Freelance Client'}
                value={newTransaction.merchant}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, merchant: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dining">Dining</SelectItem>
                  <SelectItem value="groceries">Groceries</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={newTransaction.description}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add {newTransaction.transactionType === 'expense' ? 'Expense' : 'Income'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Statement Modal */}
      {console.log("TransactionManagement: Rendering UploadStatementModal with isOpen:", showUploadModal)}
      <UploadStatementModal
        isOpen={showUploadModal}
        onClose={() => {
          console.log("TransactionManagement: Closing upload modal")
          setShowUploadModal(false)
        }}
        onUpload={(file) => {
          console.log("TransactionManagement: onUpload called from modal with file:", file.name)
          return handleUploadStatement(file)
        }}
      />
    </div>
  )
}