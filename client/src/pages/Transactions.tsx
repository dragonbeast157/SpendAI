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
  Calendar
} from 'lucide-react'
import { TransactionDetailsModal } from '@/components/transactions/TransactionDetailsModal'
import { VoiceRecordModal } from '@/components/transactions/VoiceRecordModal'
import {
  getTransactions,
  markTransactionAsExpected,
  addVoiceNote,
  type Transaction,
  type TransactionFilters
} from '@/api/transactions'
import { useToast } from '@/hooks/useToast'
import { format } from 'date-fns'

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [voiceRecordTransaction, setVoiceRecordTransaction] = useState<Transaction | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadTransactions = async () => {
    try {
      console.log("Loading transactions with filters:", filters)
      setLoading(true)
      const response = await getTransactions({ ...filters, search: searchQuery })
      setTransactions((response as any).transactions)
      console.log("Transactions loaded successfully")
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-muted-foreground">View and manage your financial transactions</p>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
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
                  <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                  <SelectItem value="Groceries">Groceries</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Shopping">Shopping</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
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

            <div className="flex items-end">
              <Button onClick={loadTransactions} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Transactions ({transactions.length})
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
                      {transaction.isAnomaly && (
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
    </div>
  )
}