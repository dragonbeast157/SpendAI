import api from './api';

// Description: Get trend analysis data
// Endpoint: GET /api/analytics/spending/overview
// Request: { period?: string, categories?: Array<string> }
// Response: { monthlyComparison: any, seasonality: any, velocity: any, compliance?: any }
export const getTrendAnalysis = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/api/analytics/spending/overview?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get heat map calendar data
// Endpoint: GET /api/analytics/heatmap
// Request: { year?: number, month?: number }
// Response: { calendarData: Array<{ date: string, amount: number, violations?: number }> }
export const getHeatMapData = (params = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ calendarData: [] });
    }, 500);
  });
};

// Description: Get savings opportunities
// Endpoint: GET /api/analytics/savings/opportunities
// Request: {}
// Response: { opportunities: Array<SavingsOpportunity> }
export const getSavingsOpportunities = async () => {
  try {
    const response = await api.get('/api/analytics/savings/opportunities');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get goal tracking data
// Endpoint: GET /api/analytics/goals
// Request: {}
// Response: { goals: Array<Goal> }
export const getGoalTracking = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        goals: []
      });
    }, 400);
  });
};

// Description: Get anomalies detection
// Endpoint: GET /api/analysis/anomalies
// Request: { dateRange?: string, severityLevel?: string }
// Response: { success: boolean, anomalies: Array<any>, summary: any }
export const getAnomalies = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/analysis/anomalies?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Mark anomaly as normal
// Endpoint: POST /api/transactions/:id/mark-normal
// Request: { transactionId: string }
// Response: { success: boolean, message: string, transaction: any }
export const markAnomalyAsNormal = async (transactionId: string) => {
  try {
    const response = await api.post(`/api/transactions/${transactionId}/mark-normal`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get spending categories analysis
// Endpoint: GET /api/analysis/spending-categories
// Request: { dateRange?: string, startDate?: string, endDate?: string }
// Response: { success: boolean, data: Array<any>, totalSpending: number, period: string, dateRange: any }
export const getCategoryAnalysis = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/analysis/spending-categories?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};