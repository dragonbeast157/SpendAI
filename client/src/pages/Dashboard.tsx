import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Building2,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { useNavigate } from 'react-router-dom'
import {
  getDashboardSummary,
  getSpendingWeather,
  getSpendingTrends,
  getCategoryBreakdown,
  getRecentTransactions,
  getInsights,
  type DashboardSummary,
  type SpendingWeather,
  type SpendingTrend,
  type CategoryBreakdown,
  type RecentTransaction,
  type Insight
} from '@/api/dashboard'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList'
import { InsightsCarousel } from '@/components/dashboard/InsightsCarousel'
import { UploadStatementModal } from '@/components/banking/UploadStatementModal'
import { uploadBankStatement } from '@/api/banking'

export function Dashboard() {
  console.log('=== DASHBOARD COMPONENT START ===');
  console.log('Dashboard: Component is being rendered');
  
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  console.log('Dashboard: Current user:', user);
  console.log('Dashboard: User account type:', user?.accountType);
  console.log('Dashboard: User onboarding completed:', user?.onboardingCompleted);

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [weather, setWeather] = useState<SpendingWeather | null>(null)
  const [trends, setTrends] = useState<SpendingTrend[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    console.log('Dashboard: useEffect triggered, loading dashboard data');
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    console.log('=== DASHBOARD FRONTEND DEBUG START ===');
    console.log('Dashboard: Starting to load dashboard data');
    try {
      setLoading(true)
      console.log('Dashboard: Making API calls...');

      const [
        summaryData,
        weatherData,
        trendsData,
        categoriesData,
        transactionsData,
        insightsData
      ] = await Promise.all([
        getDashboardSummary(),
        getSpendingWeather(),
        getSpendingTrends(),
        getCategoryBreakdown(),
        getRecentTransactions(),
        getInsights()
      ])

      console.log('Dashboard: All API calls completed');
      console.log('Dashboard: Summary data received from API:', JSON.stringify(summaryData, null, 2));
      console.log('Dashboard: Summary totalBalance value:', summaryData?.totalBalance);
      console.log('Dashboard: Summary totalBalance type:', typeof summaryData?.totalBalance);
      console.log('Dashboard: Summary object keys:', Object.keys(summaryData || {}));

      setSummary(summaryData as DashboardSummary)
      setWeather(weatherData as SpendingWeather)
      setTrends(trendsData as SpendingTrend[])
      setCategories(categoriesData as CategoryBreakdown[])
      setRecentTransactions(transactionsData as RecentTransaction[])
      setInsights(insightsData as Insight[])

      console.log('Dashboard: All state updated successfully');
      console.log('Dashboard: Summary state after setSummary:', summaryData);
    } catch (error) {
      console.error('Dashboard: Error loading dashboard data:', error)
      toast({
        title: "Error loading dashboard",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log('Dashboard: Loading completed');
      console.log('=== DASHBOARD FRONTEND DEBUG END ===');
    }
  }

  console.log('Dashboard: About to render, loading state:', loading);

  if (loading) {
    console.log('Dashboard: Rendering loading state');
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  console.log('Dashboard: Rendering main dashboard content');
  console.log('=== DASHBOARD COMPONENT RENDER ===');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your financial overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Statement
          </Button>
          <Button onClick={() => navigate('/transactions')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary?.totalBalance?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.balanceChange && summary.balanceChange > 0 ? '+' : ''}
              {summary?.balanceChange || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${summary?.monthlySpending?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.spendingChange && summary.spendingChange > 0 ? '+' : ''}
              {summary?.spendingChange || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.transactionCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        {user?.accountType === 'business' && (
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary?.complianceScore || 100}%
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.violations || 0} violations this month
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Spending Weather */}
      {weather && (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {weather.status === 'sunny' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {weather.status === 'cloudy' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {weather.status === 'stormy' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              Spending Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{weather.message}</p>
            {weather.recommendation && (
              <p className="text-sm text-muted-foreground mt-2">{weather.recommendation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Your spending over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendingChart data={trends} />
          </CardContent>
        </Card>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categories} />
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle>Smart Insights</CardTitle>
            <CardDescription>AI-powered recommendations for your finances</CardDescription>
          </CardHeader>
          <CardContent>
            <InsightsCarousel insights={insights} />
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentTransactionsList transactions={recentTransactions} />
        </CardContent>
      </Card>

      {/* Upload Statement Modal */}
      <UploadStatementModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={async (file) => {
          try {
            await uploadBankStatement(file)
            toast({
              title: "Success",
              description: "Bank statement uploaded successfully",
            })
            loadDashboardData()
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to upload statement",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}