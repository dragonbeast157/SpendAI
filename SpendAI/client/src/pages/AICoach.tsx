import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Mic, Bot, User } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { sendChatMessage, getChatHistory, getConversationStarters } from '@/api/aiCoach'

export function AICoach() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<any[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [starters, setStarters] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadInitialData = async () => {
    try {
      const [historyRes, startersRes] = await Promise.all([
        getChatHistory(),
        getConversationStarters('business')
      ])
      setMessages((historyRes as any).messages || [])
      setStarters((startersRes as any).starters || [])
    } catch (error: any) {
      toast({
        title: 'Error loading chat',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim()
    if (!messageToSend) return

    const userMessage = {
      _id: Date.now().toString(),
      message: messageToSend,
      type: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await sendChatMessage({ message: messageToSend }) as any

      const aiMessage = {
        _id: (Date.now() + 1).toString(),
        message: typeof response.response === 'string' ? response.response : 'I apologize, but I encountered an issue generating a response. Please try again.',
        type: 'ai',
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions || [],
        actions: response.actions || [],
        potentialSavings: response.potentialSavings
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
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
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {starters.map((starter, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(starter)}
                        className="text-left justify-start"
                      >
                        {starter}
                      </Button>
                    ))}
                  </div>
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