import api from './api';

// Description: Get transactions list with filters
// Endpoint: GET /api/transactions
// Request: { page?: number, limit?: number, category?: string, searchTerm?: string, dateRange?: string, startDate?: string, endDate?: string, anomaliesOnly?: boolean, policyStatus?: string }
// Response: { transactions: Array<Transaction>, pagination: { page: number, limit: number, total: number, pages: number, hasMore: boolean } }
export const getTransactions = async (filters = {}) => {
  try {
    console.log('=== API TRANSACTIONS DEBUG ENHANCED START ===');
    console.log('API: getTransactions called with filters:', filters);
    console.log('API: searchTerm in filters:', filters.searchTerm);
    console.log('API: search in filters:', filters.search);
    console.log('API: searchTerm type:', typeof filters.searchTerm);
    console.log('API: searchTerm length:', filters.searchTerm?.length);

    const params = new URLSearchParams();
    console.log('API: Building URL parameters...');

    Object.entries(filters).forEach(([key, value]) => {
      console.log(`API: Processing filter ${key} = "${value}" (type: ${typeof value})`);
      if (value !== undefined && value !== '' && value !== false) {
        console.log(`API: Adding param ${key} = "${value}"`);
        params.append(key, value.toString());
      } else {
        console.log(`API: Skipping param ${key} = "${value}" (filtered out)`);
      }
    });

    const finalUrl = `/api/transactions?${params.toString()}`;
    console.log('API: Final request URL:', finalUrl);
    console.log('API: Params string:', params.toString());
    console.log('API: URL contains searchTerm?', finalUrl.includes('searchTerm'));
    console.log('API: URL contains search?', finalUrl.includes('search'));
    console.log('API: Making HTTP GET request...');

    const response = await api.get(finalUrl);

    console.log('API: HTTP response received');
    console.log('API: Response status:', response.status);
    console.log('API: Response data keys:', Object.keys(response.data));
    console.log('API: Transactions count:', response.data.transactions?.length);
    console.log('API: First transaction:', response.data.transactions?.[0]);
    console.log('=== API TRANSACTIONS DEBUG ENHANCED END ===');

    return response.data;
  } catch (error: any) {
    console.error('=== API TRANSACTIONS ERROR ===');
    console.error('API: getTransactions error:', error);
    console.error('API: Error response:', error.response);
    console.error('API: Error response data:', error.response?.data);
    console.error('=== END API TRANSACTIONS ERROR ===');
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get transaction details by ID
// Endpoint: GET /api/transactions/:id
// Request: { id: string }
// Response: { transaction: TransactionDetail }
export const getTransactionById = async (id: string) => {
  try {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create new transaction
// Endpoint: POST /api/transactions
// Request: { amount: number, date: string, merchant: string, description: string, category?: string, location?: string }
// Response: { success: boolean, message: string, transaction: Transaction }
export const createTransaction = async (data: { amount: number; date: string; merchant: string; description: string; category?: string; location?: string }) => {
  try {
    const response = await api.post('/api/transactions', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update transaction
// Endpoint: PUT /api/transactions/:id
// Request: { id: string, data: Partial<Transaction> }
// Response: { success: boolean, message: string, transaction: Transaction }
export const updateTransaction = async (id: string, data: any) => {
  try {
    const response = await api.put(`/api/transactions/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Delete transaction
// Endpoint: DELETE /api/transactions/:id
// Request: { id: string }
// Response: { success: boolean, message: string }
export const deleteTransaction = async (id: string) => {
  try {
    const response = await api.delete(`/api/transactions/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Add voice note to transaction
// Endpoint: POST /api/transactions/:id/voice-note
// Request: { id: string, audioData: string, transcript?: string }
// Response: { success: boolean, message: string }
export const addVoiceNote = async (id: string, data: { audioData: string; transcript?: string }) => {
  try {
    console.log('=== ADD VOICE NOTE API CALL START ===');
    console.log('addVoiceNote: Called with transaction ID:', id);
    console.log('addVoiceNote: Voice note data:', { hasAudioData: !!data.audioData, transcript: data.transcript });

    const response = await api.post(`/api/transactions/${id}/voice-note`, data);

    console.log('addVoiceNote: API response received');
    console.log('addVoiceNote: Response status:', response.status);
    console.log('addVoiceNote: Response data:', response.data);
    console.log('=== ADD VOICE NOTE API CALL END ===');

    return response.data;
  } catch (error: any) {
    console.error('=== ADD VOICE NOTE API ERROR ===');
    console.error('addVoiceNote: Error occurred:', error);
    console.error('addVoiceNote: Error message:', error.message);
    console.error('addVoiceNote: Error response:', error.response);
    console.error('addVoiceNote: Error response data:', error.response?.data);
    console.error('addVoiceNote: Error response status:', error.response?.status);
    console.error('=== END ADD VOICE NOTE API ERROR ===');
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Update transaction category
// Endpoint: PUT /api/transactions/:id/category
// Request: { id: string, category: string }
// Response: { success: boolean, message: string }
export const updateTransactionCategory = async (id: string, category: string) => {
  try {
    const response = await api.put(`/api/transactions/${id}/category`, { category });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Mark anomaly as normal
// Endpoint: POST /api/transactions/:id/mark-normal
// Request: { id: string }
// Response: { success: boolean, message: string }
export const markAnomalyAsNormal = async (id: string) => {
  try {
    console.log('=== MARK ANOMALY AS NORMAL API CALL START ===');
    console.log('markAnomalyAsNormal: Called with transaction ID:', id);
    console.log('markAnomalyAsNormal: Making API call to:', `/api/transactions/${id}/mark-normal`);

    const response = await api.post(`/api/transactions/${id}/mark-normal`);

    console.log('markAnomalyAsNormal: API response received');
    console.log('markAnomalyAsNormal: Response status:', response.status);
    console.log('markAnomalyAsNormal: Response data:', response.data);
    console.log('=== MARK ANOMALY AS NORMAL API CALL END ===');

    return response.data;
  } catch (error: any) {
    console.error('=== MARK ANOMALY AS NORMAL API ERROR ===');
    console.error('markAnomalyAsNormal: Error occurred:', error);
    console.error('markAnomalyAsNormal: Error message:', error.message);
    console.error('markAnomalyAsNormal: Error response:', error.response);
    console.error('markAnomalyAsNormal: Error response data:', error.response?.data);
    console.error('markAnomalyAsNormal: Error response status:', error.response?.status);
    console.error('markAnomalyAsNormal: Full error object:', JSON.stringify(error, null, 2));
    console.error('=== END MARK ANOMALY AS NORMAL API ERROR ===');
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Check policy compliance for transaction
// Endpoint: POST /api/transactions/:id/compliance-check
// Request: { id: string }
// Response: { success: boolean, compliance: { status: string, rule: string } }
export const checkPolicyCompliance = async (id: string) => {
  try {
    const response = await api.post(`/api/transactions/${id}/compliance-check`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Check transaction for anomalies
// Endpoint: POST /api/transactions/check-anomaly
// Request: { amount: number, category: string, merchant: string }
// Response: { success: boolean, anomaly: { hasAnomaly: boolean, reason?: string, severity?: string } }
export const checkTransactionAnomaly = async (data: { amount: number; category: string; merchant: string }) => {
  try {
    const response = await api.post('/api/transactions/check-anomaly', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Mark transaction as expected (for anomaly handling)
// Endpoint: POST /api/transactions/:id/mark-expected
// Request: { id: string }
// Response: { success: boolean, message: string }
export const markTransactionAsExpected = async (id: string) => {
  try {
    const response = await api.post(`/api/transactions/${id}/mark-expected`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// TypeScript interfaces
export interface Transaction {
  _id: string;
  amount: number;
  date: string;
  merchant: string;
  description: string;
  category: string;
  location?: string;
  hasAnomaly: boolean;
  isAnomaly?: boolean;  // Add this for compatibility
  anomalyReason?: string;
  anomalyComparison?: string;
  anomalyScore?: number;
  hasNote: boolean;
  voiceNote?: string;
  policyStatus?: 'compliant' | 'warning' | 'violation';
  policyRule?: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  category?: string;
  searchTerm?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  anomaliesOnly?: boolean;
  policyStatus?: string;
  sortBy?: string;
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}