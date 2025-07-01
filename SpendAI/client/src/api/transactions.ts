import api from './api';

// Description: Get transactions list with filters
// Endpoint: GET /api/transactions
// Request: { page?: number, limit?: number, category?: string, searchTerm?: string, dateRange?: string, anomaliesOnly?: boolean, policyStatus?: string }
// Response: { transactions: Array<Transaction>, totalCount: number, hasMore: boolean }
export const getTransactions = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/transactions?${params.toString()}`);
    return response.data;
  } catch (error: any) {
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
    const response = await api.post(`/api/transactions/${id}/voice-note`, data);
    return response.data;
  } catch (error: any) {
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
    const response = await api.post(`/api/transactions/${id}/mark-normal`);
    return response.data;
  } catch (error: any) {
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
  anomaliesOnly?: boolean;
  policyStatus?: string;
  sortBy?: string;
}