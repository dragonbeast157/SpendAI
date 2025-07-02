import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Mic, Bot, User, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { sendChatMessage, getChatHistory, getConversationStarters, clearChatHistory } from '@/api/aiCoach'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function AICoach() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)
  const [starters, setStarters] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  console.log('AICoach RENDER: messages.length =', messages.length);
  console.log('AICoach RENDER: starters.length =', starters.length);
  console.log('AICoach RENDER: starters =', starters);
  console.log('AICoach RENDER: loading =', loading);

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadInitialData = async () => {
    console.log('AICoach: Starting to load initial data...');
    try {
      console.log('AICoach: About to call getChatHistory and getConversationStarters');

      // Call both APIs but handle errors separately
      const [historyRes, startersRes] = await Promise.allSettled([
        getChatHistory(),
        getConversationStarters('business')
      ]);

      console.log('AICoach: getChatHistory result:', historyRes);
      console.log('AICoach: getConversationStarters result:', startersRes);

      // Handle chat history result
      if (historyRes.status === 'fulfilled') {
        console.log('AICoach: Chat history loaded successfully:', historyRes.value);
        const historyMessages = (historyRes.value as any).messages || [];
        console.log('AICoach: Raw history messages:', historyMessages);

        // Convert chat history format to conversation format
        const conversationMessages = historyMessages.flatMap((entry: any) => {
          const messages = [];
          // Add user message if it exists
          if (entry.message && entry.message !== 'AI Generated Response') {
            messages.push({
              _id: `${entry._id}_user`,
              message: entry.message,
              type: 'user',
              timestamp: entry.createdAt || new Date().toISOString()
            });
          }
          // Add AI response
          if (entry.response) {
            messages.push({
              _id: entry._id,
              message: entry.response,
              type: 'ai',
              timestamp: entry.createdAt || new Date().toISOString(),
              suggestions: entry.suggestions || [],
              actions: entry.actions || [],
              potentialSavings: entry.potentialSavings || 0
            });
          }
          return messages;
        });

        console.log('AICoach: Converted conversation messages:', conversationMessages);
        console.log('AICoach: Setting messages to:', conversationMessages);
        setMessages(conversationMessages);
      } else {
        console.error('AICoach: Failed to load chat history:', historyRes.reason);
        setMessages([]); // Set empty array as fallback
      }

      // Handle conversation starters result
      if (startersRes.status === 'fulfilled') {
        console.log('AICoach: Conversation starters loaded successfully:', startersRes.value);
        const startersArray = (startersRes.value as any).starters || [];
        console.log('AICoach: Starters array:', startersArray);
        console.log('AICoach: Setting starters to:', startersArray);
        setStarters(startersArray);
        console.log('AICoach: State updated - starters count:', startersArray.length);
      } else {
        console.error('AICoach: Failed to load conversation starters:', startersRes.reason);
        // Set fallback starters
        const fallbackStarters = [
          "How can I stay compliant with company policy?",
          "What are my most common policy violations?",
          "Help me justify this business expense",
          "Show me compliant vendors in my area"
        ];
        console.log('AICoach: Setting fallback starters:', fallbackStarters);
        setStarters(fallbackStarters);
        console.log('AICoach: Using fallback starters');
      }

    } catch (error: any) {
      console.error('AICoach: Unexpected error in loadInitialData:', error);
      console.error('AICoach: Error message:', error.message);
      console.error('AICoach: Error stack:', error.stack);

      // Set fallback data
      setMessages([]);
      const fallbackStarters = [
        "How can I stay compliant with company policy?",
        "What are my most common policy violations?",
        "Help me justify this business expense",
        "Show me compliant vendors in my area"
      ];
      setStarters(fallbackStarters);

      toast({
        title: 'Partial loading error',
        description: 'Some features may be limited. Please refresh the page.',
        variant: 'destructive'
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleClearHistory = async () => {
    setClearingHistory(true)
    try {
      console.log('AICoach: Clearing chat history...');
      const result = await clearChatHistory()
      console.log('AICoach: Chat history cleared:', result);
      
      // Clear messages from UI
      setMessages([])
      
      toast({
        title: 'Chat history cleared',
        description: `Deleted ${result.deletedCount} messages successfully.`,
      })
    } catch (error: any) {
      console.error('AICoach: Error clearing chat history:', error);
      toast({
        title: 'Error clearing history',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setClearingHistory(false)
    }
  }

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim()
    console.log('AICoach: handleSendMessage called with:', messageToSend);
    if (!messageToSend) return

    const userMessage = {
      _id: Date.now().toString(),
      message: messageToSend,
      type: 'user',
      timestamp: new Date().toISOString()
    }

    console.log('AICoach: Adding user message to chat:', userMessage);
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      console.log('AICoach: About to call sendChatMessage with:', { message: messageToSend });
      const response = await sendChatMessage({ message: messageToSend }) as any
      console.log('AICoach: Received response from sendChatMessage:', response);
      console.log('AICoach: Response type:', typeof response.response);
      console.log('AICoach: Response content:', response.response);

      const aiMessage = {
        _id: (Date.now() + 1).toString(),
        message: typeof response.response === 'string' ? response.response : 'I apologize, but I encountered an issue generating a response. Please try again.',
        type: 'ai',
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions || [],
        actions: response.actions || [],
        potentialSavings: response.potentialSavings
      }

      console.log('AICoach: Adding AI message to chat:', aiMessage);
      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error('AICoach: Error in handleSendMessage:', error);
      console.error('AICoach: Error message:', error.message);
      console.error('AICoach: Error stack:', error.stack);
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  console.log('AICoach RENDER: About to render, checking conditions...');
  console.log('AICoach RENDER: messages.length === 0?', messages.length === 0);
  console.log('AICoach RENDER: starters.length > 0?', starters.length > 0);
  console.log('AICoach RENDER: Will show welcome section?', messages.length === 0);

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Financial Coach</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-gray-600">Online • Business Account</p>
            </div>
          </div>
        </div>
        
        {/* Clear History Button */}
        {messages.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={clearingHistory}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {clearingHistory ? 'Clearing...' : 'Clear History'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all chat history? This action cannot be undone and will permanently delete all your conversation messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearHistory}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear History
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="flex-1 flex space-x-6">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Chat with your AI Coach</CardTitle>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Hi! I'm your AI financial coach
                  </h3>
                  <p className="text-gray-600 mb-6">
                    I can help you with spending analysis, policy compliance, and financial advice.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%]`}>
                    {message.type === 'ai' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-500 text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {message.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} className="text-xs bg-white/20 px-2 py-1 rounded">
                              • {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.actions.map((action: any, index: number) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                      {message.potentialSavings && (
                        <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Potential savings: ${message.potentialSavings}
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-purple-500 text-white">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Always show conversation starters if available */}
              {starters.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {messages.length === 0 ? 'Try asking:' : 'Ask me about:'}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {console.log('AICoach RENDER: Rendering main chat starters, count:', starters.length)}
                    {starters.slice(0, 4).map((starter, index) => {
                      console.log('AICoach RENDER: Rendering main starter', index, ':', starter);
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendMessage(starter)}
                          className="text-left justify-start text-xs h-auto py-2 px-3"
                        >
                          {starter}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your spending, policy compliance, or get financial advice..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                className="flex-shrink-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage()}
                disabled={loading || !inputMessage.trim()}
                className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions Sidebar */}
        <Card className="w-80 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Popular Questions</h4>
              <div className="space-y-2">
                {console.log('AICoach RENDER: Sidebar starters, count:', starters.length)}
                {starters.slice(0, 3).map((starter, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(starter)}
                    className="w-full text-left justify-start text-xs"
                  >
                    {starter}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Quick Insights</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Badge className="mb-2">Spending Alert</Badge>
                  <p className="text-sm text-gray-700">
                    You're 15% over your dining budget this month
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Badge className="mb-2 bg-green-100 text-green-800">Policy Status</Badge>
                  <p className="text-sm text-gray-700">
                    94% compliance rate - great job!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}