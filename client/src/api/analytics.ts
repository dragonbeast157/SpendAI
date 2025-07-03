import api from './api';

// Description: Get trend analysis data
// Endpoint: GET /api/analytics/spending/overview
// Request: { period?: string, categories?: Array<string> }
// Response: { monthlyComparison: any, seasonality: any, velocity: any, compliance?: any }
export const getTrendAnalysis = async (filters = {}) => {
  try {
    console.log('=== getTrendAnalysis API CALL START ===');
    console.log('getTrendAnalysis: Called with filters:', filters);
    
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

    console.log('getTrendAnalysis: URL params:', params.toString());
    console.log('getTrendAnalysis: Making API call to:', `/api/analytics/spending/overview?${params.toString()}`);

    const response = await api.get(`/api/analytics/spending/overview?${params.toString()}`);
    
    console.log('getTrendAnalysis: API response received');
    console.log('getTrendAnalysis: Response status:', response.status);
    console.log('getTrendAnalysis: Response data:', response.data);
    console.log('getTrendAnalysis: Response data type:', typeof response.data);
    console.log('getTrendAnalysis: Response data keys:', Object.keys(response.data || {}));
    
    if (response.data && response.data.monthlyComparison) {
      console.log('getTrendAnalysis: monthlyComparison data:', response.data.monthlyComparison);
      console.log('getTrendAnalysis: monthlyComparison.data:', response.data.monthlyComparison.data);
      console.log('getTrendAnalysis: monthlyComparison.data length:', response.data.monthlyComparison.data?.length);
    } else {
      console.log('getTrendAnalysis: NO monthlyComparison data found in response');
    }
    
    console.log('=== getTrendAnalysis API CALL END ===');
    return response.data;
  } catch (error: any) {
    console.error('=== getTrendAnalysis API ERROR ===');
    console.error('getTrendAnalysis: Error occurred:', error);
    console.error('getTrendAnalysis: Error message:', error.message);
    console.error('getTrendAnalysis: Error response:', error.response);
    console.error('getTrendAnalysis: Error response data:', error.response?.data);
    console.error('getTrendAnalysis: Error response status:', error.response?.status);
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
    console.log('=== getSavingsOpportunities API CALL START ===');
    console.log('getSavingsOpportunities: Making API call');
    
    const response = await api.get('/api/analytics/savings/opportunities');
    
    console.log('getSavingsOpportunities: API response received');
    console.log('getSavingsOpportunities: Response status:', response.status);
    console.log('getSavingsOpportunities: Response data:', response.data);
    console.log('getSavingsOpportunities: Opportunities count:', response.data?.opportunities?.length || 0);
    console.log('=== getSavingsOpportunities API CALL END ===');
    
    return response.data;
  } catch (error: any) {
    console.error('=== getSavingsOpportunities API ERROR ===');
    console.error('getSavingsOpportunities: Error:', error);
    console.error('getSavingsOpportunities: Error message:', error.message);
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
    }, 500);
  });
};

// Add a simple test function at the top
export const testAnalysisAPI = async () => {
  try {
    console.log('=== TESTING ANALYSIS API CONNECTIVITY ===');
    
    // Test 1: Basic API test
    console.log('Test 1: Basic analysis API test...');
    const basicTest = await api.get('/api/analysis/test');
    console.log('Test 1 Result:', basicTest.data);
    
    // Test 2: Auth test
    console.log('Test 2: Analysis API with auth test...');
    const authTest = await api.get('/api/analysis/test-auth');
    console.log('Test 2 Result:', authTest.data);
    
    console.log('=== ANALYSIS API TESTS COMPLETE ===');
    return { success: true, basicTest: basicTest.data, authTest: authTest.data };
  } catch (error: any) {
    console.error('=== ANALYSIS API TEST FAILED ===');
    console.error('Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    return { success: false, error: error.message };
  }
};

// Description: Get anomalies detection
// Endpoint: GET /api/analysis/anomalies
// Request: { dateRange?: string, severityLevel?: string }
// Response: { success: boolean, anomalies: Array<any>, summary: any }
export const getAnomalies = async (filters = {}) => {
  try {
    console.log('=== FRONTEND GET ANOMALIES START ===');
    console.log('getAnomalies: Called with filters:', filters);

    // First test API connectivity
    console.log('getAnomalies: Testing API connectivity first...');
    const testResult = await testAnalysisAPI();
    console.log('getAnomalies: API connectivity test result:', testResult);

    if (!testResult.success) {
      throw new Error(`API connectivity test failed: ${testResult.error}`);
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `/api/analysis/anomalies?${params.toString()}`;
    console.log('getAnomalies: Making API call to:', url);
    console.log('getAnomalies: About to call api.get...');

    const response = await api.get(url);

    console.log('getAnomalies: API response received successfully');
    console.log('getAnomalies: Response status:', response.status);
    console.log('getAnomalies: Response headers:', response.headers);
    console.log('getAnomalies: Raw response data:', JSON.stringify(response.data, null, 2));
    console.log('getAnomalies: Response data type:', typeof response.data);
    console.log('getAnomalies: Response success:', response.data?.success);
    console.log('getAnomalies: Response anomalies:', response.data?.anomalies);
    console.log('getAnomalies: Response anomalies type:', typeof response.data?.anomalies);
    console.log('getAnomalies: Response anomalies length:', response.data?.anomalies?.length);
    console.log('getAnomalies: Response summary:', response.data?.summary);

    if (response.data?.anomalies && Array.isArray(response.data.anomalies)) {
      console.log('getAnomalies: Individual anomalies:');
      response.data.anomalies.forEach((anomaly, index) => {
        console.log(`getAnomalies: Anomaly ${index + 1}:`, {
          id: anomaly._id,
          merchant: anomaly.merchant,
          amount: anomaly.amount,
          hasAnomaly: anomaly.hasAnomaly,
          severity: anomaly.anomalyDetails?.severity,
          reason: anomaly.anomalyReason
        });
      });
    } else {
      console.log('getAnomalies: NO valid anomalies array found in response');
      console.log('getAnomalies: Anomalies value is:', response.data?.anomalies);
    }

    console.log('=== FRONTEND GET ANOMALIES END ===');
    return response.data;
  } catch (error: any) {
    console.error('=== FRONTEND GET ANOMALIES ERROR ===');
    console.error('getAnomalies: Error occurred:', error);
    console.error('getAnomalies: Error name:', error.name);
    console.error('getAnomalies: Error message:', error.message);
    console.error('getAnomalies: Error response:', error.response);
    console.error('getAnomalies: Error response data:', error.response?.data);
    console.error('getAnomalies: Error response status:', error.response?.status);
    console.error('getAnomalies: Error response headers:', error.response?.headers);
    console.error('getAnomalies: Error stack:', error.stack);
    console.error('=== END FRONTEND GET ANOMALIES ERROR ===');
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
    console.log('=== getCategoryAnalysis API CALL START ===');
    console.log('getCategoryAnalysis: Called with filters:', filters);
    
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    console.log('getCategoryAnalysis: URL params:', params.toString());
    console.log('getCategoryAnalysis: Making API call to:', `/api/analysis/spending-categories?${params.toString()}`);

    const response = await api.get(`/api/analysis/spending-categories?${params.toString()}`);
    
    console.log('getCategoryAnalysis: API response received');
    console.log('getCategoryAnalysis: Response status:', response.status);
    console.log('getCategoryAnalysis: Response data:', response.data);
    console.log('getCategoryAnalysis: Response success:', response.data?.success);
    console.log('getCategoryAnalysis: Response data array:', response.data?.data);
    console.log('getCategoryAnalysis: Response data array length:', response.data?.data?.length || 0);
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      console.log('getCategoryAnalysis: Category data details:');
      response.data.data.forEach((cat, index) => {
        console.log(`getCategoryAnalysis: Category ${index}:`, cat);
      });
    } else {
      console.log('getCategoryAnalysis: NO valid category data array found');
    }
    
    console.log('=== getCategoryAnalysis API CALL END ===');
    return response.data;
  } catch (error: any) {
    console.error('=== getCategoryAnalysis API ERROR ===');
    console.error('getCategoryAnalysis: Error occurred:', error);
    console.error('getCategoryAnalysis: Error message:', error.message);
    console.error('getCategoryAnalysis: Error response:', error.response);
    console.error('getCategoryAnalysis: Error response data:', error.response?.data);
    console.error('getCategoryAnalysis: Error response status:', error.response?.status);
    throw new Error(error?.response?.data?.message || error.message);
  }
};