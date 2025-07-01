import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, Calendar, DollarSign, Activity, Download, Filter } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import {
  getTrendAnalysis,
  getHeatMapData,
  getSavingsOpportunities,
  getGoalTracking,
  getCategoryAnalysis
} from '@/api/analytics'

export function Analytics() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [trendData, setTrendData] = useState<any>(null)
  const [heatMapData, setHeatMapData] = useState<any>(null)
  const [savingsOpportunities, setSavingsOpportunities] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const [trendsRes, heatMapRes, savingsRes, goalsRes, categoryRes] = await Promise.all([
        getTrendAnalysis(),
        getHeatMapData(),
        getSavingsOpportunities(),
        getGoalTracking(),
        getCategoryAnalysis({ dateRange: 'this-month' })
      ])

      setTrendData(trendsRes)
      setHeatMapData(heatMapRes)
      setSavingsOpportunities((savingsRes as any).opportunities || [])
      setGoals((goalsRes as any).goals || [])
      setCategoryData((categoryRes as any).data || [])
    } catch (error: any) {
      toast({
        title: 'Error loading analytics',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600'
      case 'behind':
        return 'text-red-600'
      case 'ahead':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & Insights</h1>
          <p className="text-gray-600 mt-1">Deep dive into your spending patterns and trends</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Spending Velocity</p>
                <p className="text-3xl font-bold text-blue-900">{trendData?.velocity?.currentPace || 0}%</p>
                <p className="text-sm text-blue-700 mt-1">vs last month</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Savings Potential</p>
                <p className="text-3xl font-bold text-green-900">
                  ${savingsOpportunities.reduce((sum, opp) => sum + (opp.potentialSavings || 0), 0).toFixed(0)}
                </p>
                <p className="text-sm text-green-700 mt-1">This month</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Goals on Track</p>
                <p className="text-3xl font-bold text-purple-900">
                  {goals.filter(g => g.status === 'on-track').length}/{goals.length}
                </p>
                <p className="text-sm text-purple-700 mt-1">Active goals</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Analysis Period</p>
                <p className="text-2xl font-bold text-orange-900">6 Months</p>
                <p className="text-sm text-orange-700 mt-1">Data range</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Comparison Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Spending Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {trendData?.monthlyComparison?.data?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData?.monthlyComparison?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                      <Bar dataKey="current" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="previous" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg font-medium">No spending data available</p>
                      <p className="text-sm">Add some transactions to see your spending trends</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spending Velocity */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Spending Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Pace</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {trendData?.velocity?.currentPace || 0}% faster
                  </span>
                </div>
                <Progress value={trendData?.velocity?.currentPace || 0} className="h-3" />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Projected: ${trendData?.velocity?.projectedTotal || 0}</span>
                  <span>Policy Burn Rate: {trendData?.velocity?.policyBurnRate || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg font-medium">No spending categories available</p>
                      <p className="text-sm">Add some transactions to see your category breakdown</p>
                    </div>
                  </div>
                )}
              </div>
              
              {categoryData.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryData.map((category, index) => (
                    <div key={category.category} className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-gray-600">${category.amount} ({category.percentage}%)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Savings Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {savingsOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {savingsOpportunities.map((opportunity) => (
                    <div key={opportunity._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{opportunity.title}</h4>
                            <Badge className={cn(
                              opportunity.confidence === 'high' ? 'bg-green-100 text-green-800' :
                              opportunity.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            )}>
                              {opportunity.confidence} confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{opportunity.description}</p>
                          <p className="text-sm font-medium text-blue-600">{opportunity.action}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${opportunity.potentialSavings.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">potential savings</p>
                        </div>
                      </div>
                      <Button size="sm" className="w-full">
                        Apply Suggestion
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No savings opportunities found</p>
                  <p className="text-sm">Add more transactions to discover ways to save money</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Goal Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-6">
                  {goals.map((goal) => (
                    <div key={goal._id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{goal.name}</h4>
                        <Badge className={cn(
                          goal.status === 'on-track' ? 'bg-green-100 text-green-800' :
                          goal.status === 'behind' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        )}>
                          {goal.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>${goal.current.toLocaleString()} of ${goal.target.toLocaleString()}</span>
                          <span className={getStatusColor(goal.status)}>
                            {goal.progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-xs text-gray-500">
                          {goal.daysRemaining} days remaining
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No goals set</p>
                  <p className="text-sm">Create financial goals to track your progress</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}