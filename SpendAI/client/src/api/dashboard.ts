import api from './api';

export interface DashboardSummary {
  totalBalance: number;
  balanceChange: number;
  monthlySpending: number;
  spendingChange: number;
  transactionCount: number;
  complianceScore?: number;
  violations?: number;
}

export interface SpendingWeather {
  status: 'sunny' | 'cloudy' | 'stormy';
  message: string;
  recommendation?: string;
}

export interface SpendingTrend {
  month: string;
  spending: number;
  income: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RecentTransaction {
  _id: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  isAnomaly?: boolean;
  hasNote?: boolean;
  policyStatus?: 'compliant' | 'warning' | 'violation';
}

export interface Insight {
  id: string;
  type: 'savings' | 'warning' | 'achievement' | 'policy';
  title: string;
  description: string;
  amount?: number;
  category?: string;
  action?: string;
}

// Description: Get dashboard summary data
// Endpoint: GET /api/dashboard/summary
// Request: {}
// Response: { summary: DashboardSummary }
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalBalance: 12450.75,
        balanceChange: 5.2,
        monthlySpending: 3240.50,
        spendingChange: -2.1,
        transactionCount: 47,
        complianceScore: 94,
        violations: 2
      });
    }, 300);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/summary');
  //   return response.data.summary;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get spending weather status
// Endpoint: GET /api/dashboard/weather
// Request: {}
// Response: { weather: SpendingWeather }
export const getSpendingWeather = async (): Promise<SpendingWeather> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'sunny',
        message: 'Sunny skies ahead - you\'re on track for your monthly goal',
        recommendation: 'Keep up the great work! You\'re 15% under budget this month.'
      });
    }, 400);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/weather');
  //   return response.data.weather;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get spending trends over time
// Endpoint: GET /api/dashboard/trends
// Request: {}
// Response: { trends: Array<SpendingTrend> }
export const getSpendingTrends = async (): Promise<SpendingTrend[]> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { month: 'Jan', spending: 2800, income: 5000 },
        { month: 'Feb', spending: 3200, income: 5000 },
        { month: 'Mar', spending: 2900, income: 5200 },
        { month: 'Apr', spending: 3400, income: 5000 },
        { month: 'May', spending: 3100, income: 5100 },
        { month: 'Jun', spending: 3240, income: 5000 }
      ]);
    }, 500);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/trends');
  //   return response.data.trends;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get category breakdown
// Endpoint: GET /api/dashboard/categories
// Request: {}
// Response: { categories: Array<CategoryBreakdown> }
export const getCategoryBreakdown = async (): Promise<CategoryBreakdown[]> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { category: 'Dining', amount: 850, percentage: 26.2, color: '#3B82F6' },
        { category: 'Groceries', amount: 650, percentage: 20.1, color: '#10B981' },
        { category: 'Transport', amount: 420, percentage: 13.0, color: '#F59E0B' },
        { category: 'Shopping', amount: 380, percentage: 11.7, color: '#EF4444' },
        { category: 'Entertainment', amount: 320, percentage: 9.9, color: '#8B5CF6' },
        { category: 'Utilities', amount: 280, percentage: 8.6, color: '#06B6D4' },
        { category: 'Healthcare', amount: 200, percentage: 6.2, color: '#84CC16' },
        { category: 'Other', amount: 140, percentage: 4.3, color: '#6B7280' }
      ]);
    }, 350);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/categories');
  //   return response.data.categories;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get recent transactions
// Endpoint: GET /api/dashboard/transactions
// Request: {}
// Response: { transactions: Array<RecentTransaction> }
export const getRecentTransactions = async (): Promise<RecentTransaction[]> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          _id: '1',
          merchant: 'Starbucks',
          amount: -12.50,
          date: new Date().toISOString(),
          category: 'dining',
          isAnomaly: false,
          hasNote: false,
          policyStatus: 'compliant'
        },
        {
          _id: '2',
          merchant: 'Uber',
          amount: -25.80,
          date: new Date(Date.now() - 86400000).toISOString(),
          category: 'transport',
          isAnomaly: false,
          hasNote: true,
          policyStatus: 'compliant'
        },
        {
          _id: '3',
          merchant: 'Amazon',
          amount: -156.99,
          date: new Date(Date.now() - 172800000).toISOString(),
          category: 'shopping',
          isAnomaly: true,
          hasNote: false,
          policyStatus: 'warning'
        },
        {
          _id: '4',
          merchant: 'Whole Foods',
          amount: -89.45,
          date: new Date(Date.now() - 259200000).toISOString(),
          category: 'groceries',
          isAnomaly: false,
          hasNote: false,
          policyStatus: 'compliant'
        },
        {
          _id: '5',
          merchant: 'Netflix',
          amount: -15.99,
          date: new Date(Date.now() - 345600000).toISOString(),
          category: 'entertainment',
          isAnomaly: false,
          hasNote: false,
          policyStatus: 'violation'
        }
      ]);
    }, 450);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/transactions');
  //   return response.data.transactions;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get AI-powered insights
// Endpoint: GET /api/dashboard/insights
// Request: {}
// Response: { insights: Array<Insight> }
export const getInsights = async (): Promise<Insight[]> => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          type: 'savings',
          title: 'Coffee Savings Opportunity',
          description: 'You could save $50/month by making coffee at home 3 days a week',
          amount: 50,
          category: 'dining',
          action: 'View Details'
        },
        {
          id: '2',
          type: 'achievement',
          title: 'Great Job!',
          description: 'You\'re 15% under budget in groceries this month',
          amount: 120,
          category: 'groceries',
          action: 'Keep It Up'
        },
        {
          id: '3',
          type: 'warning',
          title: 'Dining Spending Up',
          description: 'Your restaurant spending is 40% higher than last month',
          amount: 340,
          category: 'dining',
          action: 'Review Transactions'
        },
        {
          id: '4',
          type: 'policy',
          title: 'Policy Compliance',
          description: '2 transactions need manager approval for entertainment expenses',
          category: 'entertainment',
          action: 'Submit for Review'
        }
      ]);
    }, 600);
  });
  // Uncomment the below lines to make an actual API call
  // try {
  //   const response = await api.get('/api/dashboard/insights');
  //   return response.data.insights;
  // } catch (error: any) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};