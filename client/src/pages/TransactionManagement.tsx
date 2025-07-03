import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Search,
  Filter,
  Mic,
  Eye,
  CheckCircle,
  Calendar,
  Plus,
  Upload,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal'
import { VoiceRecordModal } from '@/components/transactions/VoiceRecordModal'
import { UploadStatementModal } from '@/components/banking/UploadStatementModal'
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
  markTransactionAsExpected,
  addVoiceNote,
  type Transaction,
  type TransactionFilters,
  type TransactionPagination
} from '@/api/transactions'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'

export function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<TransactionPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 50,
    dateRange: 'this-month'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [voiceRecordTransaction, setVoiceRecordTransaction] = useState<Transaction | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    merchant: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0]
  })
  const { toast } = useToast()

  console.log('TransactionManagement: Component rendered')
  console.log('TransactionManagement: Current state - showUploadModal:', showUploadModal)

  useEffect(() => {
    loadTransactions(true)
  }, [filters.dateRange, filters.category, filters.anomaliesOnly, filters.policyStatus, filters.sortBy])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery !== (filters.searchTerm || '')) {
        setFilters(prev => ({ ...prev, searchTerm: searchQuery, page: 1 }))
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    // Handle custom date range
    if (startDate || endDate) {
      setFilters(prev => ({ 
        ...prev, 
        startDate, 
        endDate, 
        dateRange: '', // Clear predefined range when using custom dates
        page: 1 
      }))
    }
  }, [startDate, endDate])

  const loadTransactions = async (reset = false) => {
    try {
      console.log('TransactionManagement: Loading transactions with filters:', filters)
      
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const currentFilters = reset ? { ...filters, page: 1 } : filters
      const response = await getTransactions(currentFilters)
      
      console.log('TransactionManagement: Transactions loaded:', {
        count: response.transactions?.length,
        pagination: response.pagination
      })

      if (reset) {
        setTransactions(response.transactions || [])
      } else {
        setTransactions(prev => [...prev, ...(response.transactions || [])])
      }
      
      setPagination(response.pagination)
      
    } catch (error) {
      console.error('TransactionManagement: Error loading transactions:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    if (pagination && pagination.hasMore) {
      setFilters(prev => ({ ...prev, page: prev.page! + 1 }))
      loadTransactions(false)
    }
  }

  const handleCreateTransaction = async () => {
    try {
      console.log('TransactionManagement: Creating transaction:', newTransaction)
      
      const transactionData = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      }

      await createTransaction(transactionData)
      
      toast({
        title: "Success",
        description: "Transaction created successfully",
      })

      setShowCreateForm(false)
      setNewTransaction({
        amount: '',
        merchant: '',
        description: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0]
      })
      
      loadTransactions(true)
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
      await deleteTransaction(transactionId)
      setTransactions(prev => prev.filter(t => t._id !== transactionId))
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete transaction",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsExpected = async (transactionId: string) => {
    try {
      await markTransactionAsExpected(transactionId)
      setTransactions(prev =>
        prev.map(t =>
          t._id === transactionId
            ? { ...t, isAnomaly: false, hasAnomaly: false, anomalyReason: undefined }
            : t
        )
      )
      toast({
        title: "Success",
        description: "Transaction marked as expected",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transaction",
        variant: "destructive",
      })
    }
  }

  const handleAddVoiceNote = async (transactionId: string, audioData: string, transcript?: string) => {
    try {
      await addVoiceNote(transactionId, { audioData, transcript })
      setTransactions(prev =>
        prev.map(t =>
          t._id === transactionId
            ? { ...t, hasNote: true, voiceNote: transcript }
            : t
        )
      )
      toast({
        title: "Success",
        description: "Voice note added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add voice note",
        variant: "destructive",
      })
    }
  }

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return {
      amount: formattedAmount,
      isNegative
    }
  }

  const handleDateRangeChange = (range: string) => {
    console.log('TransactionManagement: Date range changed to:', range)
    
    if (range === 'custom') {
      // Don't change filters yet, wait for custom dates
      return
    }
    
    // Clear custom dates when selecting predefined range
    setStartDate('')
    setEndDate('')
    setFilters(prev => ({ 
      ...prev, 
      dateRange: range, 
      startDate: '', 
      endDate: '', 
      page: 1 
    }))
  }

  console.log('TransactionManagement: About to render, showUploadModal:', showUploadModal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transaction Management
          </h1>
          <p className="text-muted-foreground">View, create, and manage your financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadModal(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select
                  value={filters.dateRange || (startDate || endDate ? 'custom' : 'this-month')}
                  onValueChange={handleDateRangeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="all-time">All Time</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={filters.category || "all"}
                  onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="dining">Food & Dining</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={filters.anomaliesOnly ? "anomalies" : "all"}
                  onValueChange={(value) => setFilters({ ...filters, anomaliesOnly: value === "anomalies", page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All transactions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All transactions</SelectItem>
                    <SelectItem value="anomalies">Anomalies only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            {(filters.dateRange === '' && (startDate || endDate)) || filters.dateRange === 'custom' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select
                  value={filters.sortBy || "recent"}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value, page: 1 })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="amount-high">Highest Amount</SelectItem>
                    <SelectItem value="amount-low">Lowest Amount</SelectItem>
                    <SelectItem value="merchant">Merchant A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Results Per Page</label>
                <Select
                  value={filters.limit?.toString() || "50"}
                  onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value), page: 1 })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Create Transaction Form */}
      {showCreateForm && (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter amount (negative for expenses)"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Merchant</label>
                <Input
                  placeholder="Enter merchant name"
                  value={newTransaction.merchant}
                  onChange={(e) => setNewTransaction({ ...newTransaction, merchant: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dining">Food & Dining</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="transport">Transportation</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTransaction}>Create Transaction</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Transactions {pagination && `(${pagination.total} total)`}
            </CardTitle>
            {pagination && (
              <div className="text-sm text-muted-foreground">
                Showing {transactions.length} of {pagination.total} transactions
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  console.log('TransactionManagement: Rendering transaction:', {
                    id: transaction._id,
                    merchant: transaction.merchant,
                    amount: transaction.amount,
                    hasAnomaly: transaction.hasAnomaly,
                    anomalyReason: transaction.anomalyReason,
                    policyStatus: transaction.policyStatus,
                    policyRule: transaction.policyRule
                  })

                  const { amount, isNegative } = formatAmount(transaction.amount)
                  return (
                    <div
                      key={transaction._id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/80"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                          {transaction.merchant.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{transaction.merchant}</h3>
                            {(transaction.hasAnomaly || transaction.isAnomaly) && (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Anomaly
                              </Badge>
                            )}
                            {transaction.hasNote && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Mic className="w-3 h-3" />
                                Note
                              </Badge>
                            )}
                            {transaction.policyStatus === 'violation' && (
                              <Badge variant="destructive" className="text-xs">
                                Policy Violation
                              </Badge>
                            )}
                            {transaction.policyStatus === 'warning' && (
                              <Badge variant="secondary" className="text-xs">
                                Policy Warning
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          </div>
                          {transaction.anomalyReason && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {transaction.anomalyReason}
                            </p>
                          )}
                          {transaction.policyRule && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              {transaction.policyRule}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVoiceRecordTransaction(transaction)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(transaction.hasAnomaly || transaction.isAnomaly) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsExpected(transaction._id)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <div className={`text-sm font-bold min-w-[80px] text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                          {isNegative ? '-' : '+'}${amount}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Load More Button */}
              {pagination && pagination.hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? 'Loading...' : `Load More (${pagination.total - transactions.length} remaining)`}
                  </Button>
                </div>
              )}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your criteria.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Statement Modal */}
      {console.log('TransactionManagement: Rendering UploadStatementModal with isOpen:', showUploadModal)}
      <UploadStatementModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={() => {
          setShowUploadModal(false)
          loadTransactions(true)
        }}
      />

      {/* Modals */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onDelete={handleDeleteTransaction}
      />

      <VoiceRecordModal
        transaction={voiceRecordTransaction}
        onClose={() => setVoiceRecordTransaction(null)}
        onSave={handleAddVoiceNote}
      />
    </div>
  )
}