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
// Endpoint: GET /api/ai-coach/history
// Request: {}
// Response: { messages: Array<{ _id: string, message: string, response: string, timestamp: string, type: 'user' | 'ai' }> }
export const getChatHistory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        messages: [
          {
            _id: '1',
            message: 'How can I reduce my dining expenses?',
            response: 'Based on your spending patterns, I recommend focusing on lunch expenses which make up 60% of your dining budget...',
            timestamp: '2024-01-15T10:30:00Z',
            type: 'user'
          },
          {
            _id: '2',
            message: 'AI Coach Response',
            response: 'Based on your spending patterns, I recommend focusing on lunch expenses which make up 60% of your dining budget...',
            timestamp: '2024-01-15T10:30:05Z',
            type: 'ai'
          }
        ],
      });
    }, 400);
  });
};

// Description: Get conversation starters
// Endpoint: GET /api/coaching/starters
// Request: { accountType: 'personal' | 'business' }
// Response: { starters: Array<string> }
export const getConversationStarters = async (accountType: 'personal' | 'business') => {
  try {
    const response = await api.get(`/api/coaching/starters?accountType=${accountType}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get AI advice for specific transaction
// Endpoint: POST /api/ai-coach/transaction-advice
// Request: { transactionId: string }
// Response: { advice: string, alternatives?: Array<any>, tips?: Array<string> }
export const getTransactionAdvice = (transactionId: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        advice: "This coffee purchase is higher than your usual spending. Consider visiting during happy hour or using loyalty rewards for better deals.",
        alternatives: [
          { name: "Local Coffee Shop", avgPrice: 4.50, distance: "0.3 miles", policyCompliant: true },
          { name: "Company Cafeteria", avgPrice: 2.25, distance: "In building", policyCompliant: true }
        ],
        tips: [
          "Sign up for loyalty programs to earn free drinks",
          "Consider buying coffee beans for office brewing",
          "Look for lunch combo deals that include beverages"
        ]
      });
    }, 600);
  });
};