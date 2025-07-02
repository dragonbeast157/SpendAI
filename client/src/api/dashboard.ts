import api from './api';

export interface DashboardSummary {
  totalBalance: number
  balanceChange: number
  monthlySpending: number
  spendingChange: number
  transactionCount: number
  complianceScore?: number
  violations?: number
}

export interface SpendingWeather {
  status: 'sunny' | 'cloudy' | 'stormy'
  message: string
  recommendation?: string
}

export interface MonthlyTrend {
  month: string
  spending: number
  income: number
}

export interface SpendingTrend {
  month: string
  amount: number
  violations?: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface RecentTransaction {
  _id: string
  merchant: string
  amount: number
  date: string
  category: string
  hasAnomaly?: boolean
  policyStatus?: 'compliant' | 'warning' | 'violation'
}

export interface Insight {
  _id: string
  type: 'spending' | 'saving' | 'policy' | 'goal'
  title: string
  description: string
  action?: string
  priority: 'high' | 'medium' | 'low'
}

// Description: Get dashboard summary data including compliance score
// Endpoint: GET /api/dashboard/summary
// Request: {}
// Response: DashboardSummary
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    console.log('Dashboard API: Getting dashboard summary');
    const response = await api.get('/api/dashboard/summary');
    console.log('Dashboard API: Dashboard summary received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting dashboard summary:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get spending weather status
// Endpoint: GET /api/dashboard/weather
// Request: {}
// Response: SpendingWeather
export const getSpendingWeather = async (): Promise<SpendingWeather> => {
  try {
    console.log('Dashboard API: Getting spending weather');
    const response = await api.get('/api/dashboard/weather');
    console.log('Dashboard API: Spending weather received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting spending weather:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get spending trends data
// Endpoint: GET /api/dashboard/trends
// Request: {}
// Response: MonthlyTrend[]
export const getSpendingTrends = async (): Promise<MonthlyTrend[]> => {
  try {
    console.log('Dashboard API: Getting spending trends');
    const response = await api.get('/api/dashboard/trends');
    console.log('Dashboard API: Spending trends received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting spending trends:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get category breakdown data
// Endpoint: GET /api/dashboard/categories
// Request: {}
// Response: CategoryBreakdown[]
export const getCategoryBreakdown = async (): Promise<CategoryBreakdown[]> => {
  try {
    console.log('Dashboard API: Getting category breakdown');
    const response = await api.get('/api/dashboard/categories');
    console.log('Dashboard API: Category breakdown received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting category breakdown:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get recent transactions
// Endpoint: GET /api/dashboard/transactions
// Request: {}
// Response: RecentTransaction[]
export const getRecentTransactions = async (): Promise<RecentTransaction[]> => {
  try {
    console.log('Dashboard API: Getting recent transactions');
    const response = await api.get('/api/dashboard/transactions');
    console.log('Dashboard API: Recent transactions received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting recent transactions:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get AI insights
// Endpoint: GET /api/dashboard/insights
// Request: {}
// Response: Insight[]
export const getInsights = async (): Promise<Insight[]> => {
  try {
    console.log('Dashboard API: Getting insights');
    const response = await api.get('/api/dashboard/insights');
    console.log('Dashboard API: Insights received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Dashboard API: Error getting insights:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};