import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Calendar, CreditCard, MapPin, Mic } from 'lucide-react'
import { format } from 'date-fns'
import { type Transaction } from '@/api/transactions'

interface TransactionDetailsModalProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  if (!transaction) return null

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return {
      amount: formattedAmount,
      isNegative
    }
  }

  const { amount, isNegative } = formatAmount(transaction.amount)

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
              {transaction.merchant.charAt(0)}
            </div>
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Review transaction information and anomaly details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className={`text-2xl font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                  {isNegative ? '-' : '+'}${amount}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{transaction.merchant}</p>
                <p className="text-sm text-muted-foreground">{transaction.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(transaction.date), 'MMMM d, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{transaction.category}</p>
                <p className="text-sm text-muted-foreground">Category</p>
              </div>
            </div>
          </div>

          {/* Anomaly Information */}
          {transaction.isAnomaly && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Anomaly Detected</Badge>
                      <Badge variant="outline">
                        Score: {(transaction.anomalyScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {transaction.anomalyReason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voice Note */}
          {transaction.voiceNote && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Mic className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Voice Note
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {transaction.voiceNote}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1">
              Get Advice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}