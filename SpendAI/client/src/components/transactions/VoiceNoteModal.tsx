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
import { Mic, MicOff, Play, Pause } from 'lucide-react'
import { type Transaction } from '@/api/transactions'
import { addVoiceNote } from '@/api/transactions'
import { useToast } from '@/hooks/useToast'

interface VoiceNoteModalProps {
  transaction: Transaction
  open: boolean
  onClose: () => void
  onSave: () => void
}

export function VoiceNoteModal({ transaction, open, onClose, onSave }: VoiceNoteModalProps) {
  const [voiceNote, setVoiceNote] = useState(transaction.voiceNote || '')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!voiceNote.trim()) {
      toast({
        title: "Error",
        description: "Please add a voice note",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      await addVoiceNote(transaction._id, voiceNote)
      toast({
        title: "Success",
        description: "Voice note saved successfully",
      })
      onSave()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save voice note",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setVoiceNote("This is a mock transcription of your voice note about this transaction.")
    } else {
      // Start recording
      setIsRecording(true)
    }
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
    // Mock playback toggle
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Add Voice Note</DialogTitle>
          <DialogDescription>
            Record or type a note about this transaction: {transaction.merchant}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={toggleRecording}
              className="rounded-full w-16 h-16"
            >
              {isRecording ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>
            {voiceNote && (
              <Button
                variant="outline"
                size="lg"
                onClick={togglePlayback}
                className="rounded-full w-16 h-16"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground animate-pulse">
                Recording... Speak clearly about this transaction
              </p>
            </div>
          )}

          {/* Text Area */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Voice Note Transcription
            </label>
            <Textarea
              value={voiceNote}
              onChange={(e) => setVoiceNote(e.target.value)}
              placeholder="Your voice note will appear here, or you can type directly..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}