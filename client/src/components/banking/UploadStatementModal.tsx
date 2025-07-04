import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface UploadStatementModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success' | 'error'

export function UploadStatementModal({ isOpen, onClose, onUpload }: UploadStatementModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (file: File) => {
    console.log('=== UPLOAD MODAL FILE SELECT ===')
    console.log('UploadModal: File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    setSelectedFile(file)
    setUploadState('idle')
    setUploadProgress(0)
    setProcessingMessage('')
    console.log('=== END UPLOAD MODAL FILE SELECT ===')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      if (isValidFileType(file)) {
        handleFileSelect(file)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, CSV, or Excel file.",
          variant: "destructive",
        })
      }
    }
  }, [toast])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (isValidFileType(file)) {
        handleFileSelect(file)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, CSV, or Excel file.",
          variant: "destructive",
        })
      }
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    return validTypes.includes(file.type) || 
           file.name.toLowerCase().endsWith('.csv') ||
           file.name.toLowerCase().endsWith('.pdf') ||
           file.name.toLowerCase().endsWith('.xlsx') ||
           file.name.toLowerCase().endsWith('.xls')
  }

  const simulateProgress = (duration: number) => {
    console.log('=== SIMULATING UPLOAD PROGRESS ===')
    console.log('UploadModal: Starting progress simulation for', duration, 'ms')
    
    const steps = 20
    const interval = duration / steps
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep++
      const progress = Math.min((currentStep / steps) * 90, 90) // Cap at 90% during processing
      setUploadProgress(progress)
      
      // Update processing messages based on progress
      if (progress < 20) {
        setProcessingMessage('Uploading file...')
      } else if (progress < 40) {
        setProcessingMessage('Analyzing file format...')
      } else if (progress < 60) {
        setProcessingMessage('Extracting transactions...')
      } else if (progress < 80) {
        setProcessingMessage('Validating data...')
      } else {
        setProcessingMessage('Saving transactions...')
      }

      if (currentStep >= steps) {
        clearInterval(progressInterval)
        console.log('UploadModal: Progress simulation completed')
      }
    }, interval)

    return () => clearInterval(progressInterval)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    console.log('=== UPLOAD MODAL UPLOAD START ===')
    console.log('UploadModal: Starting upload process for file:', selectedFile.name)
    console.log('UploadModal: File size:', selectedFile.size, 'bytes')

    try {
      setUploadState('uploading')
      setUploadProgress(0)
      setProcessingMessage('Preparing upload...')

      // Start progress simulation - estimate based on file size
      const estimatedDuration = Math.max(3000, Math.min(selectedFile.size / 1000, 30000)) // 3-30 seconds
      console.log('UploadModal: Estimated processing duration:', estimatedDuration, 'ms')
      
      const clearProgress = simulateProgress(estimatedDuration)

      // Set processing state after initial upload
      setTimeout(() => {
        setUploadState('processing')
        setProcessingMessage('Processing your file... This may take a moment for large files.')
      }, 1000)

      console.log('UploadModal: Calling onUpload function...')
      await onUpload(selectedFile)

      // Clear progress simulation
      clearProgress()

      // Show completion
      setUploadState('success')
      setUploadProgress(100)
      setProcessingMessage('Upload completed successfully!')

      console.log('UploadModal: Upload completed successfully')

      // Auto-close after success
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('=== UPLOAD MODAL ERROR ===')
      console.error('UploadModal: Upload failed:', error)
      
      setUploadState('error')
      setProcessingMessage('Upload failed. Please try again.')
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload statement",
        variant: "destructive",
      })
    }
    console.log('=== END UPLOAD MODAL UPLOAD ===')
  }

  const handleClose = () => {
    console.log('UploadModal: Closing modal, resetting state')
    setSelectedFile(null)
    setUploadState('idle')
    setUploadProgress(0)
    setProcessingMessage('')
    setIsDragOver(false)
    onClose()
  }

  const getStateIcon = () => {
    switch (uploadState) {
      case 'uploading':
      case 'processing':
        return <Clock className="h-8 w-8 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <Upload className="h-8 w-8 text-gray-400" />
    }
  }

  const getStateMessage = () => {
    switch (uploadState) {
      case 'uploading':
        return 'Uploading your file...'
      case 'processing':
        return 'Processing transactions... Please wait.'
      case 'success':
        return 'Upload completed successfully!'
      case 'error':
        return 'Upload failed. Please try again.'
      default:
        return 'Select a file to upload'
    }
  }

  const isProcessing = uploadState === 'uploading' || uploadState === 'processing'

  return (
    <Dialog open={isOpen} onOpenChange={!isProcessing ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-gray-400'}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center space-y-2">
              {getStateIcon()}
              <p className="text-sm font-medium">{getStateMessage()}</p>
              
              {!isProcessing && (
                <>
                  <p className="text-xs text-gray-500">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports PDF, CSV, and Excel files
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{processingMessage}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              {uploadState === 'processing' && (
                <p className="text-xs text-amber-600 text-center">
                  Large files may take up to 30 seconds to process. Please don't close this window.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {uploadState === 'success' ? 'Close' : 'Cancel'}
            </Button>
            
            {uploadState !== 'success' && (
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Upload'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}