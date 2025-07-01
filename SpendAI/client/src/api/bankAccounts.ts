import api from './api';

// Description: Get all connected bank accounts for the current user
// Endpoint: GET /api/bank-accounts
// Request: {}
// Response: { success: boolean, accounts: Array<BankAccount> }
export const getConnectedAccounts = async () => {
  try {
    console.log('API: Fetching connected bank accounts');
    const response = await api.get('/api/bank-accounts');
    console.log('API: Connected accounts response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching connected accounts:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Connect a new bank account
// Endpoint: POST /api/bank-accounts
// Request: { bankName: string, accountNumber: string, accountType: string, credentials: { username: string, password: string } }
// Response: { success: boolean, message: string, account: BankAccount }
export const connectBankAccount = async (accountData: {
  bankName: string;
  accountNumber: string;
  accountType: string;
  routingNumber?: string;
  credentials: {
    username: string;
    password: string;
  };
}) => {
  try {
    console.log('API: Connecting bank account:', { ...accountData, credentials: '[HIDDEN]' });
    const response = await api.post('/api/bank-accounts', accountData);
    console.log('API: Bank account connection response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error connecting bank account:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Disconnect a bank account
// Endpoint: DELETE /api/bank-accounts/:id
// Request: { id: string }
// Response: { success: boolean, message: string }
export const disconnectAccount = async (accountId: string) => {
  try {
    console.log('API: Disconnecting bank account:', accountId);
    const response = await api.delete(`/api/bank-accounts/${accountId}`);
    console.log('API: Disconnect account response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error disconnecting account:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get single bank account details
// Endpoint: GET /api/bank-accounts/:id
// Request: { id: string }
// Response: { success: boolean, account: BankAccount }
export const getBankAccount = async (accountId: string) => {
  try {
    console.log('API: Fetching bank account details:', accountId);
    const response = await api.get(`/api/bank-accounts/${accountId}`);
    console.log('API: Bank account details response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: Error fetching bank account:', error);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Upload bank statement
// Endpoint: POST /api/bank-accounts/:id/statements
// Request: FormData with statement file
// Response: { success: boolean, message: string, transactionCount: number, transactions: Array<Transaction> }
export const uploadBankStatement = async (accountId: string, file: File) => {
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