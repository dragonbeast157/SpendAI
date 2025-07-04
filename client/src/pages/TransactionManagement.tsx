import { useState, useEffect, useCallback } from 'react'
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
  CalendarDays,
  Trash2,
  Upload,
  Plus
} from 'lucide-react'
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal'
import { VoiceRecordModal } from '@/components/transactions/VoiceRecordModal'
import { UploadStatementModal } from '@/components/banking/UploadStatementModal'
import {
  getTransactions,
  markTransactionAsExpected,
  addVoiceNote,
  deleteTransaction,
  createTransaction,
  type Transaction,
  type TransactionFilters
} from '@/api/transactions'
import { uploadBankStatement } from '@/api/banking'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'

export function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 100
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [voiceRecordTransaction, setVoiceRecordTransaction] = useState<Transaction | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dateRange, setDateRange] = useState('this-month')
  const { toast } = useToast()

  console.log('=== TRANSACTION MANAGEMENT COMPONENT RENDER ===');
  console.log('TransactionManagement: Component rendering');
  console.log('TransactionManagement: showUploadModal:', showUploadModal);
  console.log('TransactionManagement: Upload Statement button will be rendered');
  console.log('=== END TRANSACTION MANAGEMENT COMPONENT RENDER ===');

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTransactions();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Main filters effect
  useEffect(() => {
    loadTransactions()
  }, [filters, dateRange, startDate, endDate])

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const requestParams = {
        ...filters,
        searchTerm: searchQuery.trim(),
        dateRange: dateRange === 'custom' ? undefined : dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined
      };

      const response = await getTransactions(requestParams)
      setTransactions((response as any).transactions)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [filters, dateRange, startDate, endDate, searchQuery]);

  const handleMarkAsExpected = async (transactionId: string) => {
    try {
      await markTransactionAsExpected(transactionId)
      setTransactions(prev =>
        prev.map(t =>
          t._id === transactionId
            ? { ...t, isAnomaly: false, anomalyScore: 0 }
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

  const handleAddVoiceNote = async (transactionId: string, voiceNote: string) => {
    try {
      await addVoiceNote(transactionId, voiceNote)
      setTransactions(prev =>
        prev.map(t =>
          t._id === transactionId
            ? { ...t, voiceNote }
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

  const handleUploadStatement = async (file: File) => {
    try {
      console.log('TransactionManagement: Starting bank statement upload process');
      await uploadBankStatement(file)
      toast({
        title: "Success",
        description: "Bank statement uploaded successfully",
      })
      loadTransactions()
    } catch (error) {
      console.error('TransactionManagement: Error uploading bank statement:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      })
      throw error;
    }
  }

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await createTransaction(transactionData);
      toast({
        title: "Success",
        description: "Transaction added successfully",
      })
      loadTransactions()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      })
    }
  }

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  }

  const handleClearSearch = () => {
    setSearchQuery('');
  }

  const handleApplyFilters = () => {
    loadTransactions();
  }

  const handleUploadButtonClick = () => {
    console.log('=== UPLOAD BUTTON CLICKED IN TRANSACTION MANAGEMENT ===');
    console.log('TransactionManagement: Upload button clicked');
    setShowUploadModal(true);
    console.log('=== END UPLOAD BUTTON CLICKED ===');
  }

  const handleAddTransactionButtonClick = () => {
    console.log('=== ADD TRANSACTION BUTTON CLICKED ===');
    setShowAddTransactionModal(true);
  }

  const handleCloseUploadModal = () => {
    console.log('=== UPLOAD MODAL CLOSING ===');
    setShowUploadModal(false);
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

  const getDateRangeDisplayText = () => {
    if (dateRange === 'custom' && startDate && endDate) {
      return `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`
    }

    switch (dateRange) {
      case 'this-week': return 'This Week'
      case 'this-month': return 'This Month'
      case 'last-month': return 'Last Month'
      case 'last-3-months': return 'Last 3 Months'
      case 'last-6-months': return 'Last 6 Months'
      case 'this-year': return 'This Year'
      case 'all-time': return 'All Time'
      case 'custom': return 'Custom Range'
      default: return 'This Month'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transactions ({transactions.length})
          </h1>
          <p className="text-muted-foreground">
            View and manage your financial transactions
            {dateRange && (
              <span className="ml-2">
                • Showing: {getDateRangeDisplayText()}
              </span>
            )}
            {searchQuery && (
              <span className="ml-2">
                • Search: "{searchQuery}"
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {console.log('=== RENDERING HEADER BUTTONS IN TRANSACTION MANAGEMENT ===') || null}
          <Button onClick={handleAddTransactionButtonClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <Button variant="outline" onClick={handleUploadButtonClick}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          {console.log('=== HEADER BUTTONS RENDERED ===') || null}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category || "all"}
                onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value })}
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
                  <SelectItem value="wage">Wage/Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.anomaliesOnly ? "anomalies" : "all"}
                onValueChange={(value) => setFilters({ ...filters, anomaliesOnly: value === "anomalies" })}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Limit</label>
              <Select
                value={filters.limit?.toString() || "100"}
                onValueChange={(value) => setFilters({ ...filters, limit: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="100 transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 transactions</SelectItem>
                  <SelectItem value="100">100 transactions</SelectItem>
                  <SelectItem value="200">200 transactions</SelectItem>
                  <SelectItem value="500">500 transactions</SelectItem>
                  <SelectItem value="1000">1000 transactions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <label className="text-sm font-medium">Date Range</label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select
                  value={dateRange}
                  onValueChange={handleDateRangeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
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

              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={() => loadTransactions()}
                      className="w-full"
                      disabled={!startDate || !endDate}
                    >
                      Apply Date Range
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleApplyFilters} className="min-w-[120px]">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Transactions ({transactions.length})
            <Badge variant="outline" className="ml-2">
              {getDateRangeDisplayText()}
            </Badge>
            {searchQuery && (
              <Badge variant="secondary" className="ml-2">
                Search: "{searchQuery}"
              </Badge>
            )}
          </CardTitle>
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
            <div className="space-y-3">
              {transactions.map((transaction) => {
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
                          {transaction.isAnomaly && (
                            <Badge variant="destructive" className="text-xs flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Anomaly
                            </Badge>
                          )}
                          {transaction.voiceNote && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Mic className="w-3 h-3" />
                              Note
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{transaction.category}</span>
                          <span>•</span>
                          <span>{format(new Date(transaction.date), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        {transaction.anomalyReason && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            {transaction.anomalyReason}
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
                        title="Add Voice Note"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-green-600 hover:text-green-700"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {transaction.isAnomaly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsExpected(transaction._id)}
                          className="text-purple-600 hover:text-purple-700"
                          title="Mark as Expected"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTransaction(transaction._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete Transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className={`text-sm font-bold min-w-[80px] text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                        {isNegative ? '-' : '+'}${amount}
                      </div>
                    </div>
                  </div>
                )
              })}

              {transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchQuery ? (
                    <>
                      <p>No transactions found matching "{searchQuery}".</p>
                      <p className="text-sm">Try adjusting your search term or filters.</p>
                      <Button
                        variant="outline"
                        onClick={handleClearSearch}
                        className="mt-2"
                      >
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>No transactions found for the selected criteria.</p>
                      <p className="text-sm">Try adjusting your filters or date range.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

      <VoiceRecordModal
        transaction={voiceRecordTransaction}
        onClose={() => setVoiceRecordTransaction(null)}
        onSave={handleAddVoiceNote}
      />

      {/* Upload Statement Modal */}
      {console.log('=== UPLOAD MODAL RENDER DEBUG IN TRANSACTION MANAGEMENT ===') || null}
      {console.log('TransactionManagement: About to render UploadStatementModal') || null}
      {console.log('TransactionManagement: showUploadModal:', showUploadModal) || null}
      {console.log('=== END UPLOAD MODAL RENDER DEBUG ===') || null}
      <UploadStatementModal
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        onUpload={handleUploadStatement}
      />
    </div>
  )
}