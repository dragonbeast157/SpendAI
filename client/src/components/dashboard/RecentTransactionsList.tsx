import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mic, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface Transaction {
  _id: string
  merchant: string
  amount: number
  date: string
  category: string
  hasAnomaly: boolean
  hasNote: boolean
  policyStatus?: 'compliant' | 'warning' | 'violation'
}

interface RecentTransactionsListProps {
  transactions: Transaction[]
}

export function RecentTransactionsList({ transactions }: RecentTransactionsListProps) {
  const navigate = useNavigate()

  const getPolicyStatusColor = (status?: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'violation':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction._id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => navigate(`/transactions/${transaction._id}`)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-medium">
              {transaction.merchant.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{transaction.merchant}</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                <Badge variant="secondary" className="text-xs">
                  {transaction.category}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {transaction.hasAnomaly && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            {transaction.hasNote && (
              <Mic className="h-4 w-4 text-blue-500" />
            )}
            {transaction.policyStatus && (
              <div className={cn(
                "w-3 h-3 rounded-full",
                transaction.policyStatus === 'compliant' && "bg-green-500",
                transaction.policyStatus === 'warning' && "bg-yellow-500",
                transaction.policyStatus === 'violation' && "bg-red-500"
              )} />
            )}
            <p className={cn(
              "font-semibold",
              transaction.amount < 0 ? "text-red-600" : "text-green-600"
            )}>
              ${Math.abs(transaction.amount).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}