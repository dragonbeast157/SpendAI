import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { markAnomalyAsNormal, getAnomalies } from '@/api/analytics'

export function AnomalyDetection() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})

  useEffect(() => {
    loadAnomalies()
  }, [])

  const loadAnomalies = async () => {
    try {
      setLoading(true)
      const response = await getAnomalies({ dateRange: 'this-month' }) as any
      setAnomalies(response.anomalies || [])
      setSummary(response.summary || {})
    } catch (error: any) {
      toast({
        title: 'Error loading anomalies',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDismissAnomaly = async (transactionId: string) => {
    try {
      await markAnomalyAsNormal(transactionId)
      toast({
        title: 'Anomaly dismissed',
        description: 'Transaction marked as normal'
      })
      loadAnomalies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Anomaly Detection</h1>
          <p className="text-gray-600 mt-1">{summary.total || 0} unusual transactions detected</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-orange-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Major Anomalies</p>
                <p className="text-3xl font-bold text-red-900">{summary.major || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Moderate Anomalies</p>
                <p className="text-3xl font-bold text-yellow-900">{summary.moderate || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Minor Anomalies</p>
                <p className="text-lg font-bold text-blue-900">{summary.minor || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Detected Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {anomalies.map((transaction) => (
                <div key={transaction._id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium">
                        {transaction.merchant.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{transaction.merchant}</h4>
                          <Badge className={cn("border", getSeverityColor(transaction.anomalyDetails?.severity))}>
                            {transaction.anomalyDetails?.severity || 'Anomaly'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {transaction.anomalyDetails && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <h5 className="font-medium text-orange-800 mb-1">Why this seems unusual</h5>
                      <p className="text-sm text-orange-700">
                        {transaction.anomalyDetails.reason}
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        {transaction.anomalyDetails.comparison}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismissAnomaly(transaction._id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Normal
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/transactions/${transaction._id}`)}
                    >
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      This is OK
                    </Button>
                  </div>
                </div>
              ))}

              {anomalies.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No anomalies detected
                  </h3>
                  <p className="text-gray-600">
                    Your spending patterns look normal. Great job staying consistent!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}