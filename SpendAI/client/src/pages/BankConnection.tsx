import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Banknote,
  Plus,
  Trash2,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Building
} from 'lucide-react'
import { BankConnectionCard } from '@/components/banking/BankConnectionCard'
import { BankSelectionModal } from '@/components/banking/BankSelectionModal'
import { StatementUploadModal } from '@/components/banking/StatementUploadModal'
import {
  getBankAccounts,
  getSupportedBanks,
  connectBankAccount,
  disconnectBankAccount,
  uploadBankStatement,
  type BankAccount,
  type SupportedBank
} from '@/api/banking'
import { useToast } from '@/hooks/useToast'

export function BankConnection() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [supportedBanks, setSupportedBanks] = useState<SupportedBank[]>([])
  const [loading, setLoading] = useState(true)
  const [showBankSelection, setShowBankSelection] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log("Loading bank connection data...")
      setLoading(true)
      const [accountsResponse, banksResponse] = await Promise.all([
        getBankAccounts(),
        getSupportedBanks()
      ])
      setAccounts((accountsResponse as any).accounts)
      setSupportedBanks((banksResponse as any).banks)
      console.log("Bank connection data loaded successfully")
    } catch (error) {
      console.error("Error loading bank connection data:", error)
      toast({
        title: "Error",
        description: "Failed to load bank connection data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConnectBank = async (bankId: string) => {
    try {
      console.log("Connecting bank account:", bankId)
      const response = await connectBankAccount(bankId)
      const result = response as any

      if (result.success) {
        // In a real app, this would redirect to the bank's OAuth page
        window.open(result.authUrl, '_blank')
        toast({
          title: "Success",
          description: "Redirecting to bank authorization...",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect bank account",
        variant: "destructive",
      })
    }
  }

  const handleDisconnectBank = async (accountId: string) => {
    try {
      console.log("Disconnecting bank account:", accountId)
      await disconnectBankAccount(accountId)
      setAccounts(prev => prev.filter(acc => acc._id !== accountId))
      toast({
        title: "Success",
        description: "Bank account disconnected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect bank account",
        variant: "destructive",
      })
    }
  }

  const handleUploadStatement = async (file: File) => {
    try {
      console.log("BankConnection: handleUploadStatement called with file:", file.name)
      console.log("BankConnection: File size:", file.size, "bytes")
      console.log("BankConnection: File type:", file.type)
      console.log("BankConnection: Starting upload process...")
      
      const response = await uploadBankStatement(file)
      console.log("BankConnection: Raw API response:", response)
      console.log("BankConnection: Response type:", typeof response)
      console.log("BankConnection: Response keys:", Object.keys(response || {}))
      
      const result = response as any
      console.log("BankConnection: Processed result:", result)
      console.log("BankConnection: result.success:", result.success)
      console.log("BankConnection: result.transactionCount:", result.transactionCount)
      console.log("BankConnection: result.message:", result.message)

      console.log("BankConnection: Upload completed successfully:", result)
      
      // Show success toast with detailed logging
      const transactionCount = result.transactionCount || result.transactions?.length || 0
      console.log("BankConnection: Calculated transaction count:", transactionCount)
      
      const successMessage = `Statement uploaded successfully. ${transactionCount} transactions found.`
      console.log("BankConnection: Success message to display:", successMessage)
      
      toast({
        title: "Success",
        description: successMessage,
      })
      console.log("BankConnection: Success toast should have been displayed")

      // Refresh accounts after upload
      console.log("BankConnection: Refreshing account data...")
      loadData()
    } catch (error) {
      console.error("BankConnection: Upload error:", error)
      console.log("BankConnection: Error message:", error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      })
      console.log("BankConnection: Error toast should have been displayed")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Bank Connections
          </h1>
          <p className="text-muted-foreground">Connect your bank accounts or upload statements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          <Button onClick={() => setShowBankSelection(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>Overview of your bank account connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200/50">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {accounts.filter(acc => acc.isConnected).length}
                </p>
                <p className="text-sm text-green-600">Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">0</p>
                <p className="text-sm text-amber-600">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50">
              <Banknote className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  ${accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600">Total Balance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Connected Accounts ({accounts.length})
          </CardTitle>
          <CardDescription>Manage your connected bank accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Connected Accounts</h3>
              <p className="text-muted-foreground mb-4">
                Connect your bank accounts to start tracking your spending automatically
              </p>
              <Button onClick={() => setShowBankSelection(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Bank
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <BankConnectionCard
                  key={account._id}
                  account={account}
                  onDisconnect={handleDisconnectBank}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {console.log("BankConnection: About to render modals")}
      {console.log("BankConnection: showBankSelection:", showBankSelection)}
      {console.log("BankConnection: showUploadModal:", showUploadModal)}
      
      <BankSelectionModal
        isOpen={showBankSelection}
        onClose={() => setShowBankSelection(false)}
        banks={supportedBanks}
        onConnect={handleConnectBank}
      />

      {console.log("BankConnection: Rendering StatementUploadModal with open:", showUploadModal)}
      <StatementUploadModal
        open={showUploadModal}
        onClose={() => {
          console.log("BankConnection: Closing upload modal")
          setShowUploadModal(false)
        }}
        onUpload={(file) => {
          console.log("BankConnection: onUpload called from modal with file:", file.name)
          return handleUploadStatement(file)
        }}
      />
    </div>
  )
}