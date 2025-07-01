import api from './api';

export interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  lastSync: string;
  isConnected: boolean;
}

export interface SupportedBank {
  _id: string;
  name: string;
  isPopular: boolean;
  logo?: string;
}

// Description: Get all bank accounts for the current user
// Endpoint: GET /api/bank-accounts
// Request: {}
// Response: { success: boolean, accounts: Array<BankAccount> }
export const getBankAccounts = async () => {
  try {
    console.log('API: Fetching bank accounts');
    const response = await api.get('/api/bank-accounts');
    console.log('API: Bank accounts response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching bank accounts:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get list of supported banks
// Endpoint: GET /api/bank-accounts/supported-banks
// Request: {}
// Response: { success: boolean, banks: Array<SupportedBank> }
export const getSupportedBanks = async () => {
  try {
    console.log('API: Fetching supported banks');
    const response = await api.get('/api/bank-accounts/supported-banks');
    console.log('API: Supported banks response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching supported banks:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Connect to a bank account
// Endpoint: POST /api/bank-accounts/connect/:bankId
// Request: { bankId: string }
// Response: { success: boolean, authUrl: string, message: string }
export const connectBankAccount = async (bankId: string) => {
  try {
    console.log('API: Connecting to bank:', bankId);
    const response = await api.post(`/api/bank-accounts/connect/${bankId}`);
    console.log('API: Bank connection response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error connecting to bank:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Disconnect a bank account
// Endpoint: POST /api/bank-accounts/disconnect/:accountId
// Request: { accountId: string }
// Response: { success: boolean, message: string }
export const disconnectBankAccount = async (accountId: string) => {
  try {
    console.log('API: Disconnecting bank account:', accountId);
    const response = await api.post(`/api/bank-accounts/disconnect/${accountId}`);
    console.log('API: Disconnect response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error disconnecting bank account:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Upload bank statement
// Endpoint: POST /api/bank-accounts/upload-statement
// Request: FormData with statement file
// Response: { success: boolean, message: string, transactionCount: number }
export const uploadBankStatement = async (file: File) => {
  try {
    console.log('API: Uploading bank statement:', file.name);
    console.log('API: File details - size:', file.size, 'type:', file.type);

    const maxSizeInBytes = 1 * 1024 * 1024; // 1MB limit
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 1MB.`);
    }

    const formData = new FormData();
    formData.append('statement', file);

    console.log('API: Making POST request to /api/bank-accounts/upload-statement');
    const response = await api.post('/api/bank-accounts/upload-statement', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    console.log('API: Statement upload response received');
    console.log('API: Response status:', response.status);
    console.log('API: Response data:', response.data);
    console.log('API: Response data type:', typeof response.data);
    console.log('API: Response data keys:', Object.keys(response.data || {}));

    return response.data;
  } catch (error: any) {
    console.error('API: Error uploading statement:', error);
    console.log('API: Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response) {
      if (error.response.status === 413) {
        throw new Error('File size too large. Please upload a file smaller than 1MB.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error occurred. Please try again later.');
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout. Please try again with a smaller file.');
    }

    throw new Error(error?.response?.data?.message || error.message);
  }
};