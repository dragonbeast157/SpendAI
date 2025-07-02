import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Lightbulb
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import { getTrendAnalysis, getSavingsOpportunities, getCategoryAnalysis } from '@/api/analytics'
import { ExportButton } from '@/components/ExportButton'
import { MonthlyComparisonChart } from '@/components/analytics/MonthlyComparisonChart'
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdownChart'
import { SpendingTrendChart } from '@/components/analytics/SpendingTrendChart'

interface SpendingOverview {
  monthlyComparison: {
    data: Array<{
      month: string
      current: number
      previous: number
      compliance: number
      violations: number
    }>
  }
  seasonality: {
    categories: Record<string, number[]>
  }
  velocity: {
    currentPace: number
    projectedTotal: number
    policyBurnRate: number
  }
  compliance?: {
    trend: number[]
    violationsByCategory: Record<string, number>
  }
  totalSpending: number
  averageMonthlySpend: number
  period: string
}

interface SavingsOpportunity {
  _id: string
  title: string
  description: string
  category: string
  potentialSavings: number
  confidence: 'high' | 'medium' | 'low'
  action: string
  severity: 'high' | 'medium' | 'low'
}

interface CategoryData {
  category: string
  amount: number
  percentage: number
  policyLimit?: number
}

export function Analytics() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [spendingOverview, setSpendingOverview] = useState<SpendingOverview | null>(null)
  const [savingsOpportunities, setSavingsOpportunities] = useState<SavingsOpportunity[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('6-months')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    console.log('=== ANALYTICS USEEFFECT TRIGGERED ===');
    console.log('Analytics: useEffect triggered with selectedPeriod:', selectedPeriod);
    console.log('Analytics: useEffect triggered with selectedCategories:', selectedCategories);
    loadAnalyticsData()
  }, [selectedPeriod, selectedCategories])

  const loadAnalyticsData = async () => {
    try {
      console.log('=== ANALYTICS LOAD DATA START ===');
      console.log('Analytics: Starting to load analytics data');
      console.log('Analytics: User:', user);
      console.log('Analytics: Current filters:', { period: selectedPeriod, categories: selectedCategories });
      
      setLoading(true)
      console.log('Analytics: Set loading to true');

      console.log('Analytics: About to make API calls...');
      
      // Make API calls individually to see which one fails
      console.log('Analytics: Making getTrendAnalysis call...');
      let overviewData;
      try {
        overviewData = await getTrendAnalysis({ period: selectedPeriod, categories: selectedCategories });
        console.log('Analytics: getTrendAnalysis SUCCESS:', overviewData);
      } catch (error) {
        console.error('Analytics: getTrendAnalysis FAILED:', error);
        overviewData = null;
      }

      console.log('Analytics: Making getSavingsOpportunities call...');
      let savingsData;
      try {
        savingsData = await getSavingsOpportunities();
        console.log('Analytics: getSavingsOpportunities SUCCESS:', savingsData);
      } catch (error) {
        console.error('Analytics: getSavingsOpportunities FAILED:', error);
        savingsData = { opportunities: [] };
      }

      console.log('Analytics: Making getCategoryAnalysis call...');
      let categoryAnalysis;
      try {
        categoryAnalysis = await getCategoryAnalysis({ dateRange: selectedPeriod });
        console.log('Analytics: getCategoryAnalysis SUCCESS:', categoryAnalysis);
      } catch (error) {
        console.error('Analytics: getCategoryAnalysis FAILED:', error);
        categoryAnalysis = { success: false, data: [] };
      }

      console.log('Analytics: All API calls completed');
      console.log('Analytics: overviewData:', overviewData);
      console.log('Analytics: savingsData:', savingsData);
      console.log('Analytics: categoryAnalysis:', categoryAnalysis);

      // Set overview data
      console.log('Analytics: Setting spending overview...');
      setSpendingOverview(overviewData);
      console.log('Analytics: Spending overview set');

      // Set savings data
      console.log('Analytics: Setting savings opportunities...');
      setSavingsOpportunities(savingsData?.opportunities || []);
      console.log('Analytics: Savings opportunities set:', savingsData?.opportunities?.length || 0);

      // Transform and set category data
      console.log('Analytics: Processing category data...');
      if (categoryAnalysis && categoryAnalysis.success && categoryAnalysis.data && Array.isArray(categoryAnalysis.data)) {
        console.log('Analytics: Category analysis has valid data array');
        console.log('Analytics: Raw category data:', categoryAnalysis.data);
        
        const transformedCategories = categoryAnalysis.data.map((cat: any, index: number) => {
          console.log(`Analytics: Transforming category ${index}:`, cat);
          const transformed = {
            category: cat.category,
            amount: cat.totalAmount || cat.amount,
            percentage: cat.percentage,
            policyLimit: cat.policyLimit
          };
          console.log(`Analytics: Transformed category ${index}:`, transformed);
          return transformed;
        });
        
        console.log('Analytics: All transformed categories:', transformedCategories);
        setCategoryData(transformedCategories);
        console.log('Analytics: Category data state updated');
      } else {
        console.log('Analytics: No valid category data - setting empty array');
        console.log('Analytics: categoryAnalysis exists:', !!categoryAnalysis);
        console.log('Analytics: categoryAnalysis.success:', categoryAnalysis?.success);
        console.log('Analytics: categoryAnalysis.data exists:', !!categoryAnalysis?.data);
        console.log('Analytics: categoryAnalysis.data is array:', Array.isArray(categoryAnalysis?.data));
        setCategoryData([]);
      }

      console.log('Analytics: All data processing completed');
      console.log('=== ANALYTICS LOAD DATA END ===');

    } catch (error) {
      console.error('=== ANALYTICS LOAD DATA ERROR ===');
      console.error('Analytics: Error loading analytics data:', error);
      console.error('Analytics: Error type:', typeof error);
      console.error('Analytics: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Analytics: Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      toast({
        title: "Error loading analytics",
        description: error instanceof Error ? error.message : "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      console.log('Analytics: Setting loading to false');
      setLoading(false)
    }
  }

  console.log('=== ANALYTICS RENDER START ===');
  console.log('Analytics: About to render component');
  console.log('Analytics: loading state:', loading);
  console.log('Analytics: spendingOverview:', spendingOverview);
  console.log('Analytics: categoryData:', categoryData);
  console.log('Analytics: categoryData length:', categoryData.length);

  if (loading) {
    console.log('Analytics: Rendering loading state');
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

  console.log('Analytics: Rendering main content');
  console.log('=== ANALYTICS RENDER END ===');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your spending patterns and financial health.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton format="csv" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </ExportButton>
          <ExportButton format="json" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </ExportButton>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-months">Last 3 Months</SelectItem>
                <SelectItem value="6-months">Last 6 Months</SelectItem>
                <SelectItem value="12-months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Spending Overview</TabsTrigger>
          <TabsTrigger value="savings">Savings Opportunities</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${spendingOverview?.totalSpending?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {spendingOverview?.period || 'Last 6 months'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${spendingOverview?.averageMonthlySpend?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per month average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spending Velocity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {spendingOverview?.velocity?.currentPace > 0 ? '+' : ''}
                  {spendingOverview?.velocity?.currentPace?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  vs last month
                </p>
              </CardContent>
            </Card>

            {user?.accountType === 'business' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {spendingOverview?.complianceScore || spendingOverview?.compliance?.overallScore || 100}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {spendingOverview?.compliance?.totalViolations || 0} violations this period
                  </p>
                  {console.log('Analytics: Rendering compliance card with data:', {
                    complianceScore: spendingOverview?.complianceScore,
                    overallScore: spendingOverview?.compliance?.overallScore,
                    totalViolations: spendingOverview?.compliance?.totalViolations,
                    fullComplianceData: spendingOverview?.compliance
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Comparison</CardTitle>
                <CardDescription>Current vs previous month spending</CardDescription>
              </CardHeader>
              <CardContent>
                {console.log('Analytics: Rendering MonthlyComparisonChart with data:', spendingOverview?.monthlyComparison?.data)}
                {spendingOverview?.monthlyComparison?.data && spendingOverview.monthlyComparison.data.length > 0 ? (
                  <MonthlyComparisonChart data={spendingOverview.monthlyComparison.data} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <p>No monthly comparison data available</p>
                      <p className="text-sm">Try adjusting your filters or add some transactions</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Spending distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                {console.log('Analytics: Rendering CategoryBreakdownChart with data:', categoryData)}
                {categoryData.length > 0 ? (
                  <CategoryBreakdownChart data={categoryData} />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No category data available</p>
                      <p className="text-sm">Try adjusting your filters or add some transactions</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <div className="grid gap-4">
            {savingsOpportunities.length > 0 ? (
              savingsOpportunities.map((opportunity) => (
                <Card key={opportunity._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                        <Badge variant={opportunity.severity === 'high' ? 'destructive' : opportunity.severity === 'medium' ? 'default' : 'secondary'}>
                          {opportunity.severity}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${opportunity.potentialSavings.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Potential savings
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{opportunity.category}</Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant={opportunity.confidence === 'high' ? 'default' : 'secondary'}>
                          {opportunity.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">Recommended Action:</p>
                      <p className="text-sm text-muted-foreground">{opportunity.action}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Great job!</h3>
                  <p className="text-muted-foreground">
                    No immediate savings opportunities detected. Your spending patterns look optimized.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trends</CardTitle>
              <CardDescription>Your spending patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              {spendingOverview?.monthlyComparison?.data && (
                <SpendingTrendChart
                  data={spendingOverview.monthlyComparison.data.map(item => ({
                    month: item.month,
                    amount: item.current,
                    violations: item.violations
                  }))}
                />
              )}
            </CardContent>
          </Card>

          {user?.accountType === 'business' && spendingOverview?.compliance && (
            <Card>
              <CardHeader>
                <CardTitle>Policy Compliance Trend</CardTitle>
                <CardDescription>Monthly compliance percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {spendingOverview.compliance.trend.map((compliance, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm">
                        Month {index + 1}
                      </div>
                      <Progress value={compliance} className="flex-1" />
                      <div className="w-16 text-sm text-right">
                        {compliance.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}