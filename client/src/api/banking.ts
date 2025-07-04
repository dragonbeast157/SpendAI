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

// Description: Connect bank account with form data
// Endpoint: POST /api/bank-accounts/connect
// Request: { bankName: string, accountNumber: string, accountType: string, credentials: object }
// Response: { success: boolean, message: string, account: BankAccount }
export const connectBankAccountWithForm = async (accountData: any) => {
  try {
    console.log('API: Connecting bank account with form data');
    const response = await api.post('/api/bank-accounts/connect', accountData);
    console.log('API: Bank connection response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error connecting bank account:', error);
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
// Response: { success: boolean, message: string, transactionCount: number, transactions: Array<Transaction> }
export const uploadBankStatement = async (file: File) => {
  console.log('=== FRONTEND: UPLOAD BANK STATEMENT START ===');
  console.log('Frontend: uploadBankStatement called with file:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });

  const formData = new FormData();
  formData.append('file', file);
  
  console.log('Frontend: FormData created, file appended');
  console.log('Frontend: Making API request to /api/bank-accounts/upload-statement');

  try {
    const response = await api.post('/api/bank-accounts/upload-statement', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Frontend: API response received:', response.data);
    console.log('=== FRONTEND: UPLOAD BANK STATEMENT SUCCESS ===');
    return response.data;
  } catch (error: any) {
    console.error('=== FRONTEND: UPLOAD BANK STATEMENT ERROR ===');
    console.error('Frontend: Upload error:', error);
    console.error('Frontend: Error response:', error.response?.data);
    console.error('Frontend: Error status:', error.response?.status);
    console.error('=== END FRONTEND ERROR ===');
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Upload bank statement for a specific account
// Endpoint: POST /api/bank-accounts/{accountId}/statements
// Request: FormData with statement file
// Response: { success: boolean, message: string, transactionCount: number, transactions: Array<Transaction> }
export const uploadBankStatementForAccount = async (accountId: string, file: File) => {
  try {
    console.log('API: Uploading bank statement for account:', accountId);
    console.log('API: File details:', { name: file.name, size: file.size, type: file.type });

    // More conservative file size limit for infrastructure compatibility
    const maxSizeInBytes = 1 * 1024 * 1024; // 1MB limit
    if (file.size > maxSizeInBytes) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum limit of 1MB. Please use a smaller file or split large statements into multiple uploads.`);
    }

    const formData = new FormData();
    formData.append('statement', file);

    const response = await api.post(`/api/bank-accounts/${accountId}/statements`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for uploads
    });

    console.log('API: Bank statement upload response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error uploading bank statement:', error);

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 413) {
        throw new Error('File size too large. Please upload a file smaller than 1MB.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error occurred. Please try again later.');
      } else if (error.response.data && typeof error.response.data === 'object' && error.response.data.message) {
        throw new Error(error.response.data.message);
      } else {
        // Handle HTML error pages (like 413 from nginx/openresty)
        const errorText = error.response.data;
        if (typeof errorText === 'string' && errorText.includes('413') && errorText.includes('Too Large')) {
          throw new Error('File size too large. Please upload a file smaller than 1MB.');
        } else if (typeof errorText === 'string' && errorText.includes('<html>')) {
          throw new Error('Server configuration error. Please contact support or try a smaller file.');
        } else {
          throw new Error(`Upload failed with status ${error.response.status}. Please try again.`);
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error or server timeout. Please check your connection and try again with a smaller file.');
    } else if (error.code === 'ECONNABORTED') {
      // Request timeout
      throw new Error('Upload timeout. Please try again with a smaller file.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred during upload.');
    }
  }
};