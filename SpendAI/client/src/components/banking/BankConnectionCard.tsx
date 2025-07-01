import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, Trash2, RotateCw } from 'lucide-react'
import { format } from 'date-fns'
import { type BankAccount } from '@/api/banking'

interface BankConnectionCardProps {
  account: BankAccount
  onDisconnect: (accountId: string) => void
}

export function BankConnectionCard({ account, onDisconnect }: BankConnectionCardProps) {
  const handleDisconnect = () => {
    if (confirm(`Are you sure you want to disconnect ${account.bankName}?`)) {
      onDisconnect(account._id)
    }
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{account.bankName}</h3>
                <Badge variant={account.isConnected ? "default" : "secondary"}>
                  {account.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{account.accountType}</span>
                <span>•</span>
                <span>{account.accountNumber}</span>
                <span>•</span>
                <span>Last sync: {format(new Date(account.lastSync), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${account.balance.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Balance</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}