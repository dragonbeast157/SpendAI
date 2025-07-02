import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mic } from 'lucide-react'
import { format } from 'date-fns'
import { type RecentTransaction } from '@/api/dashboard'

interface TransactionItemProps {
  transaction: RecentTransaction
}

export function TransactionItem({ transaction }: TransactionItemProps) {
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
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-all duration-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/80">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
          {transaction.merchant.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{transaction.merchant}</p>
            {transaction.isAnomaly && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Anomaly
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{transaction.category}</span>
            <span>•</span>
            <span>{format(new Date(transaction.date), 'MMM d, h:mm a')}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Mic className="h-4 w-4" />
        </Button>
        <div className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
          {isNegative ? '-' : '+'}${amount}
        </div>
      </div>
    </div>
  )
}