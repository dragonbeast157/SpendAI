console.log('=== TRANSACTIONS PAGE LOADING ===');
console.log('Transactions.tsx file is being loaded/executed');
console.log('Current timestamp:', new Date().toISOString());
console.log('=== END TRANSACTIONS PAGE LOADING ===');

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

export function Transactions() {
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

  // Add useEffect to log when component mounts
  useEffect(() => {
    console.log('=== TRANSACTIONS COMPONENT MOUNTED ===');
    console.log('Transactions: Component has mounted successfully');
    console.log('Transactions: Initial state values:');
    console.log('- showUploadModal:', showUploadModal);
    console.log('- showAddTransactionModal:', showAddTransactionModal);
    console.log('- transactions length:', transactions.length);
    console.log('- loading:', loading);
    console.log('=== END TRANSACTIONS COMPONENT MOUNTED ===');
  }, []);

  // Add useEffect to log every render
  useEffect(() => {
    console.log('=== TRANSACTIONS COMPONENT RENDER ===');
    console.log('Transactions: Component is rendering');
    console.log('Transactions: Current timestamp:', new Date().toISOString());
    console.log('Transactions: showUploadModal:', showUploadModal);
    console.log('Transactions: showAddTransactionModal:', showAddTransactionModal);
    console.log('=== END TRANSACTIONS COMPONENT RENDER ===');
  });

  console.log('=== COMPONENT RENDER DEBUG ===');
  console.log('Transactions: Component rendering with dateRange:', dateRange);
  console.log('Transactions: startDate:', startDate, 'endDate:', endDate);
  console.log('Transactions: searchQuery:', searchQuery);
  console.log('Transactions: transactions.length:', transactions.length);
  console.log('Transactions: loading:', loading);
  console.log('Transactions: showUploadModal:', showUploadModal);
  console.log('Transactions: showAddTransactionModal:', showAddTransactionModal);
  console.log('=== HEADER BUTTONS DEBUG ===');
  console.log('Transactions: Add Transaction button should be rendered in header');
  console.log('Transactions: Upload Statement button should be rendered in header');
  console.log('Transactions: Both buttons should be visible side by side');
  console.log('=== END COMPONENT RENDER DEBUG ===');

  // Debounced search effect
  useEffect(() => {
    console.log('=== SEARCH DEBOUNCE EFFECT ===');
    console.log('Search query changed to:', searchQuery);

    const timeoutId = setTimeout(() => {
      console.log('Debounced search executing for:', searchQuery);
      loadTransactions();
    }, 300); // 300ms debounce

    return () => {
      console.log('Clearing search timeout');
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Main filters effect (excluding search since it's handled above)
  useEffect(() => {
    console.log('=== FILTERS EFFECT TRIGGER ===')
    console.log('Transactions: Filters effect triggered')
    console.log('Transactions: Current filters:', filters)
    console.log('Transactions: Current dateRange:', dateRange)
    console.log('Transactions: Current startDate:', startDate)
    console.log('Transactions: Current endDate:', endDate)
    console.log('=== END FILTERS EFFECT TRIGGER ===')

    loadTransactions()
  }, [filters, dateRange, startDate, endDate])

  const loadTransactions = useCallback(async () => {
    try {
      console.log("=== LOAD TRANSACTIONS DEBUG ENHANCED START ===");
      console.log("Transactions: Loading transactions with current state:");
      console.log("Transactions: - filters:", filters);
      console.log("Transactions: - dateRange:", dateRange);
      console.log("Transactions: - startDate:", startDate, "endDate:", endDate);
      console.log("Transactions: - searchQuery:", searchQuery);
      console.log("Transactions: - searchQuery trimmed:", searchQuery.trim());
      console.log("Transactions: - searchQuery length:", searchQuery.length);

      setLoading(true);

      // Build the request parameters - ALWAYS include searchTerm
      const requestParams = {
        ...filters,
        searchTerm: searchQuery.trim(), // Always include search term, even if empty
        dateRange: dateRange === 'custom' ? undefined : dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined
      };

      console.log("Transactions: Final request parameters:", requestParams);
      console.log("Transactions: searchTerm being sent:", requestParams.searchTerm);
      console.log("Transactions: searchTerm is empty?", requestParams.searchTerm === '');

      const response = await getTransactions(requestParams)

      console.log("Transactions: API response received:", response);
      console.log("Transactions: Transactions count in response:", response?.transactions?.length);
      console.log("Transactions: First few merchants:", response?.transactions?.slice(0, 3)?.map(t => t.merchant));

      setTransactions((response as any).transactions)

      console.log("Transactions: State updated with", (response as any).transactions.length, "transactions");
      console.log("=== LOAD TRANSACTIONS DEBUG ENHANCED END ===");
    } catch (error) {
      console.error("=== LOAD TRANSACTIONS ERROR ===");
      console.error("Transactions: Error loading transactions:", error);
      console.error("=== END LOAD TRANSACTIONS ERROR ===");
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
      console.log('Transactions: Starting bank statement upload process');
      console.log('Transactions: File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      await uploadBankStatement(file)

      console.log('Transactions: Bank statement uploaded successfully');
      toast({
        title: "Success",
        description: "Bank statement uploaded successfully",
      })

      // Reload transactions to show newly imported data
      console.log('Transactions: Reloading transactions after successful upload');
      loadTransactions()
    } catch (error) {
      console.error('Transactions: Error uploading bank statement:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      })
      throw error; // Re-throw to let the modal handle the error state
    }
  }

  const handleAddTransaction = async (transactionData: any) => {
    try {
      console.log('Transactions: Adding new transaction:', transactionData);

      const newTransaction = await createTransaction(transactionData);

      console.log('Transactions: Transaction added successfully');
      toast({
        title: "Success",
        description: "Transaction added successfully",
      })

      // Reload transactions to show the new transaction
      console.log('Transactions: Reloading transactions after adding new transaction');
      loadTransactions()
    } catch (error) {
      console.error('Transactions: Error adding transaction:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
        variant: "destructive",
      })
    }
  }

  const handleDateRangeChange = (value: string) => {
    console.log("=== DATE RANGE CHANGE DEBUG ===");
    console.log("Transactions: Date range changed to:", value);
    setDateRange(value);

    if (value !== 'custom') {
      console.log("Transactions: Clearing custom date inputs for predefined range");
      setStartDate('');
      setEndDate('');
    }
    console.log("=== END DATE RANGE CHANGE DEBUG ===");
  }

  const handleCustomDateChange = () => {
    console.log("=== CUSTOM DATE CHANGE DEBUG ===");
    console.log("Transactions: Custom date range applied - Start:", startDate, "End:", endDate);
    console.log("=== END CUSTOM DATE CHANGE DEBUG ===");
    // The useEffect will trigger loadTransactions automatically
  }

  // Simplified search handler - just update state, let useEffect handle the rest
  const handleSearchChange = (value: string) => {
    console.log("=== SEARCH CHANGE DEBUG ===");
    console.log("Transactions: Search query changing from:", searchQuery, "to:", value);
    setSearchQuery(value);
    console.log("=== END SEARCH CHANGE DEBUG ===");
  }

  // Clear search handler
  const handleClearSearch = () => {
    console.log("=== CLEAR SEARCH DEBUG ===");
    console.log("Transactions: Clearing search query");
    setSearchQuery('');
    console.log("=== END CLEAR SEARCH DEBUG ===");
  }

  // Manual apply filters handler
  const handleApplyFilters = () => {
    console.log("=== APPLY FILTERS MANUALLY ===");
    console.log("Transactions: Manually applying filters");
    console.log("Transactions: Current searchQuery:", searchQuery);
    console.log("Transactions: Current filters:", filters);
    loadTransactions();
    console.log("=== END APPLY FILTERS MANUALLY ===");
  }

  const handleUploadButtonClick = () => {
    console.log('=== UPLOAD BUTTON CLICKED ===');
    console.log('Transactions: Upload button clicked, current showUploadModal:', showUploadModal);
    console.log('Transactions: Setting showUploadModal to true');
    setShowUploadModal(true);
    console.log('=== END UPLOAD BUTTON CLICKED ===');
  }

  const handleAddTransactionButtonClick = () => {
    console.log('=== ADD TRANSACTION BUTTON CLICKED ===');
    console.log('Transactions: Add Transaction button clicked, current showAddTransactionModal:', showAddTransactionModal);
    console.log('Transactions: Setting showAddTransactionModal to true');
    setShowAddTransactionModal(true);
    console.log('=== END ADD TRANSACTION BUTTON CLICKED ===');
  }

  const handleCloseUploadModal = () => {
    console.log('=== UPLOAD MODAL CLOSING ===');
    console.log('Transactions: Upload modal closing, current showUploadModal:', showUploadModal);
    console.log('Transactions: Setting showUploadModal to false');
    setShowUploadModal(false);
    console.log('=== END UPLOAD MODAL CLOSING ===');
  }

  const handleCloseAddTransactionModal = () => {
    console.log('=== ADD TRANSACTION MODAL CLOSING ===');
    console.log('Transactions: Add Transaction modal closing, current showAddTransactionModal:', showAddTransactionModal);
    console.log('Transactions: Setting showAddTransactionModal to false');
    setShowAddTransactionModal(false);
    console.log('=== END ADD TRANSACTION MODAL CLOSING ===');
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

  console.log('=== RENDER PHASE DEBUG ===');
  console.log('Transactions: About to render component');
  console.log('Transactions: showUploadModal state:', showUploadModal);
  console.log('Transactions: showAddTransactionModal state:', showAddTransactionModal);
  console.log('Transactions: Both buttons will be rendered with onClick handlers');
  console.log('=== CHECKING BUTTON COMPONENTS ===');
  console.log('Transactions: Button component available:', typeof Button);
  console.log('Transactions: Plus icon available:', typeof Plus);
  console.log('Transactions: Upload icon available:', typeof Upload);
  console.log('=== END RENDER PHASE DEBUG ===');

  return (
    <div className="space-y-6">
      {console.log('=== HEADER SECTION RENDERING ===') || null}
      {console.log('Transactions: Starting to render header section') || null}
      {/* Header */}
      <div className="flex items-center justify-between">
        {console.log('=== HEADER CONTAINER RENDERED ===') || null}
        <div>
          {console.log('=== TITLE SECTION RENDERING ===') || null}
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
          {console.log('=== TITLE SECTION RENDERED ===') || null}
        </div>
        <div className="flex gap-2">
          {console.log('=== BUTTONS CONTAINER RENDERING ===') || null}
          {console.log('Transactions: About to render buttons container') || null}
          {console.log('Transactions: handleAddTransactionButtonClick function exists:', typeof handleAddTransactionButtonClick === 'function') || null}
          {console.log('Transactions: handleUploadButtonClick function exists:', typeof handleUploadButtonClick === 'function') || null}
          
          {console.log('=== ADD TRANSACTION BUTTON RENDERING ===') || null}
          <Button 
            onClick={handleAddTransactionButtonClick}
            style={{ backgroundColor: 'red', border: '2px solid black' }} // Temporary styling to make it visible
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          {console.log('=== ADD TRANSACTION BUTTON RENDERED ===') || null}
          
          {console.log('=== UPLOAD STATEMENT BUTTON RENDERING ===') || null}
          <Button 
            variant="outline" 
            onClick={handleUploadButtonClick}
            style={{ backgroundColor: 'blue', color: 'white', border: '2px solid black' }} // Temporary styling to make it visible
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          {console.log('=== UPLOAD STATEMENT BUTTON RENDERED ===') || null}
          {console.log('=== BUTTONS CONTAINER RENDERED ===') || null}
        </div>
        {console.log('=== HEADER CONTAINER FULLY RENDERED ===') || null}
      </div>
      {console.log('=== HEADER SECTION FULLY RENDERED ===') || null}

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
              {searchQuery && (
                <p className="text-xs text-muted-foreground">
                  Searching in merchant names and descriptions
                </p>
              )}
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
                      onClick={handleCustomDateChange}
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
      {console.log('=== UPLOAD MODAL RENDER DEBUG ===') || null}
      {console.log('Transactions: About to render UploadStatementModal') || null}
      {console.log('Transactions: showUploadModal:', showUploadModal) || null}
      {console.log('Transactions: handleCloseUploadModal function exists:', typeof handleCloseUploadModal) || null}
      {console.log('Transactions: handleUploadStatement function exists:', typeof handleUploadStatement) || null}
      {console.log('=== END UPLOAD MODAL RENDER DEBUG ===') || null}
      <UploadStatementModal
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        onUpload={handleUploadStatement}
      />
    </div>
  )
}