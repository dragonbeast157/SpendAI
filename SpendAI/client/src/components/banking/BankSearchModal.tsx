import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Star } from 'lucide-react'
import { type SupportedBank } from '@/api/banking'

interface BankSearchModalProps {
  banks: SupportedBank[]
  open: boolean
  onClose: () => void
  onConnect: (bankId: string) => void
  connecting: string | null
}

export function BankSearchModal({ banks, open, onClose, onConnect, connecting }: BankSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const popularBanks = filteredBanks.filter(bank => bank.isPopular)
  const otherBanks = filteredBanks.filter(bank => !bank.isPopular)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Connect Your Bank</DialogTitle>
          <DialogDescription>
            Search for your bank to securely connect your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for your bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Popular Banks */}
          {popularBanks.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Popular Banks
              </h4>
              <div className="space-y-2">
                {popularBanks.map((bank) => (
                  <div
                    key={bank._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {bank.name.charAt(0)}
                      </div>
                      <span className="font-medium">{bank.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onConnect(bank._id)}
                      disabled={connecting === bank._id}
                    >
                      {connecting === bank._id ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Banks */}
          {otherBanks.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-3">All Banks</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {otherBanks.map((bank) => (
                  <div
                    key={bank._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {bank.name.charAt(0)}
                      </div>
                      <span className="font-medium">{bank.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConnect(bank._id)}
                      disabled={connecting === bank._id}
                    >
                      {connecting === bank._id ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredBanks.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No banks found matching "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching with a different term or contact support
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}