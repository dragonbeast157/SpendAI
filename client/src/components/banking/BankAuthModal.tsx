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
import { Label } from '@/components/ui/label'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { connectBankAccountWithForm } from '@/api/banking'

interface BankAuthModalProps {
  isOpen: boolean
  onClose: () => void
  selectedBank: any
  onSuccess: () => void
}

export function BankAuthModal({ isOpen, onClose, selectedBank, onSuccess }: BankAuthModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    accountType: 'checking'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBank) {
      console.error('BankAuthModal: No bank selected')
      toast({
        title: 'Error',
        description: 'No bank selected. Please try again.',
        variant: 'destructive'
      })
      return
    }

    if (!formData.username || !formData.password) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      console.log('BankAuthModal: Connecting bank account:', selectedBank.name)

      const accountData = {
        bankName: selectedBank.name,
        accountNumber: `****${Math.floor(Math.random() * 10000)}`, // Mock account number
        accountType: formData.accountType,
        credentials: {
          username: formData.username,
          password: formData.password
        }
      }

      console.log('BankAuthModal: Account data being sent:', { ...accountData, credentials: '[HIDDEN]' })

      await connectBankAccountWithForm(accountData)

      toast({
        title: 'Bank account connected',
        description: `${selectedBank.name} has been connected successfully`
      })

      // Reset form
      setFormData({
        username: '',
        password: '',
        accountType: 'checking'
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('BankAuthModal: Error connecting bank account:', error.message)
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no bank is selected
  if (!selectedBank) {
    console.log('BankAuthModal: No selected bank, not rendering modal')
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {selectedBank.name?.charAt(0) || 'B'}
            </div>
            Connect to {selectedBank.name || 'Bank'}
          </DialogTitle>
          <DialogDescription>
            Enter your online banking credentials to securely connect your account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Online Banking Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Online Banking Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <select
              id="accountType"
              value={formData.accountType}
              onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="checking">Checking Account</option>
              <option value="savings">Savings Account</option>
              <option value="business">Business Account</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Your credentials are encrypted and stored securely using bank-grade security.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Connecting...' : 'Connect Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}