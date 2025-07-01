import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Building, Star } from 'lucide-react'
import { type SupportedBank } from '@/api/banking'

interface BankSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  banks: SupportedBank[]
  onConnect: (bankId: string) => void
}

export function BankSelectionModal({ isOpen, onClose, banks, onConnect }: BankSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const popularBanks = filteredBanks.filter(bank => bank.isPopular)
  const otherBanks = filteredBanks.filter(bank => !bank.isPopular)

  const handleConnect = (bankId: string) => {
    onConnect(bankId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Connect Your Bank
          </DialogTitle>
          <DialogDescription>
            Select your bank to securely connect your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for your bank..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Popular Banks */}
          {popularBanks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <h3 className="font-semibold text-sm">Popular Banks</h3>
              </div>
              <div className="space-y-2">
                {popularBanks.map((bank) => (
                  <Button
                    key={bank._id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => handleConnect(bank._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{bank.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Secure connection via Open Banking
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Other Banks */}
          {otherBanks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Other Banks</h3>
              <div className="space-y-2">
                {otherBanks.map((bank) => (
                  <Button
                    key={bank._id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => handleConnect(bank._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                        <Building className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{bank.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Secure connection via Open Banking
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredBanks.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No banks found</h3>
              <p className="text-sm text-muted-foreground">
                Try a different search term or contact support
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}