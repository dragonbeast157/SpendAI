import api from './api';

// Description: Send message to AI coach
// Endpoint: POST /api/coaching/advice
// Request: { message: string, context?: any }
// Response: { response: string, suggestions?: Array<string>, charts?: any, actions?: Array<any> }
export const sendChatMessage = async (data: { message: string; context?: any }) => {
  try {
    const response = await api.post('/api/coaching/advice', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get conversation history
// Endpoint: GET /api/ai/chat-history
// Request: {}
// Response: { messages: Array<{ _id: string, message: string, response: string, timestamp: string, type: 'user' | 'ai' }> }
export const getChatHistory = async () => {
  try {
    const response = await api.get('/api/ai/chat-history');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Clear conversation history
// Endpoint: DELETE /api/ai/chat-history
// Request: {}
// Response: { success: boolean, message: string, deletedCount: number }
export const clearChatHistory = async () => {
  try {
    const response = await api.delete('/api/ai/chat-history');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get conversation starters
// Endpoint: GET /api/ai/conversation-starters
// Request: { accountType?: 'personal' | 'business' }
// Response: { starters: Array<string> }
export const getConversationStarters = async (accountType?: 'personal' | 'business') => {
  console.log('aiCoach API: getConversationStarters called with accountType:', accountType);
  try {
    const url = `/api/ai/conversation-starters${accountType ? `?accountType=${accountType}` : ''}`;
    console.log('aiCoach API: Making request to URL:', url);
    const response = await api.get(url);
    console.log('aiCoach API: getConversationStarters raw response:', response);
    console.log('aiCoach API: getConversationStarters response data:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('aiCoach API: getConversationStarters error:', error);
    console.error('aiCoach API: Error response:', error.response);
    console.error('aiCoach API: Error response data:', error.response?.data);
    console.error('aiCoach API: Error response status:', error.response?.status);
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get AI financial advice with category
// Endpoint: POST /api/ai/financial-advice
// Request: { category?: string, message?: string, context?: any, goals?: string }
// Response: { response: string, suggestions: Array<string>, actions: Array<any>, potentialSavings?: number }
export const getFinancialAdvice = async (data: {
  category?: string;
  message?: string;
  context?: any;
  goals?: string;
}) => {
  try {
    const response = await api.post('/api/ai/financial-advice', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get AI advice for specific transaction
// Endpoint: POST /api/ai/transaction-advice
// Request: { transactionId: string }
// Response: { advice: string, alternatives?: Array<any>, tips?: Array<string> }
export const getTransactionAdvice = async (transactionId: string) => {
  try {
    const response = await api.post('/api/ai/transaction-advice', { transactionId });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};