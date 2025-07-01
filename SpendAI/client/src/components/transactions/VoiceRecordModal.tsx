import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Square, Play } from 'lucide-react'
import { type Transaction } from '@/api/transactions'

interface VoiceRecordModalProps {
  transaction: Transaction | null
  onClose: () => void
  onSave: (transactionId: string, voiceNote: string) => void
}

export function VoiceRecordModal({ transaction, onClose, onSave }: VoiceRecordModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [voiceNote, setVoiceNote] = useState(transaction?.voiceNote || '')
  const [recordingTime, setRecordingTime] = useState(0)

  if (!transaction) return null

  const handleStartRecording = () => {
    console.log("Starting voice recording...")
    setIsRecording(true)
    setRecordingTime(0)
    
    // Simulate recording timer
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    // Auto-stop after 60 seconds
    setTimeout(() => {
      setIsRecording(false)
      clearInterval(timer)
      // Simulate transcription
      setVoiceNote("This is a simulated voice transcription. In a real app, this would be the actual transcribed audio.")
    }, 3000) // Shortened for demo
  }

  const handleStopRecording = () => {
    console.log("Stopping voice recording...")
    setIsRecording(false)
    // Simulate transcription
    setVoiceNote("This is a simulated voice transcription. In a real app, this would be the actual transcribed audio.")
  }

  const handleSave = () => {
    if (voiceNote.trim()) {
      onSave(transaction._id, voiceNote.trim())
      onClose()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Add Voice Note
          </DialogTitle>
          <DialogDescription>
            Record a voice note for {transaction.merchant}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <Card className="bg-slate-50 dark:bg-slate-800">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
                  {transaction.merchant.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{transaction.merchant}</p>
                  <p className="text-xs text-muted-foreground">
                    ${Math.abs(transaction.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <div className="flex flex-col items-center space-y-4">
            {isRecording ? (
              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <MicOff className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600">Recording...</p>
                  <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStopRecording}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Button
                  size="lg"
                  onClick={handleStartRecording}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  <Mic className="h-8 w-8" />
                </Button>
                <p className="text-sm text-muted-foreground">Tap to start recording</p>
              </div>
            )}
          </div>

          {/* Transcription */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcription</label>
            <Textarea
              placeholder="Your voice note will appear here..."
              value={voiceNote}
              onChange={(e) => setVoiceNote(e.target.value)}
              rows={4}
              disabled={isRecording}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!voiceNote.trim() || isRecording}
            >
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}