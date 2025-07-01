import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, X, CheckCircle, Clock } from 'lucide-react'

interface UploadStatementModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

export function UploadStatementModal({ isOpen, onClose, onUpload }: UploadStatementModalProps) {
  console.log('UploadStatementModal: Component rendered with isOpen:', isOpen)
  console.log('UploadStatementModal: This is the UploadStatementModal component used on transactions page!')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing' | 'complete'>('uploading')
  const [dragActive, setDragActive] = useState(false)

  console.log('UploadStatementModal: Current state - uploading:', uploading, 'uploadProgress:', uploadProgress, 'selectedFile:', selectedFile?.name || 'none')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      console.log('UploadStatementModal: File dropped:', e.dataTransfer.files[0].name)
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.log('UploadStatementModal: File selected:', e.target.files[0].name)
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) {
      console.log('UploadStatementModal: Upload blocked - no file or already uploading')
      return
    }

    try {
      console.log('UploadStatementModal: Starting upload process')
      console.log('UploadStatementModal: Setting uploading state to true')
      setUploading(true)
      console.log('UploadStatementModal: Setting upload progress to 0')
      setUploadProgress(0)
      console.log('UploadStatementModal: Setting upload stage to uploading')
      setUploadStage('uploading')

      console.log('UploadStatementModal: Starting file upload with progress tracking')
      console.log('UploadStatementModal: File details:', {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      })

      // Stage 1: File upload simulation (0-30%)
      console.log('UploadStatementModal: Starting upload stage (0-30%)')
      for (let progress = 0; progress <= 30; progress += 5) {
        setUploadProgress(progress)
        console.log('UploadStatementModal: Upload progress:', progress + '%')
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log('UploadStatementModal: Upload stage complete, starting processing stage')

      // Stage 2: Processing stage (30-70%) - Start API call here
      console.log('UploadStatementModal: Setting stage to processing')
      setUploadStage('processing')
      console.log('UploadStatementModal: Starting processing stage (30-70%)')

      // Start the actual upload API call and progress simulation in parallel
      console.log('UploadStatementModal: Calling onUpload function with file:', selectedFile.name)
      const apiCallPromise = onUpload(selectedFile)

      // Continue progress simulation while API call is happening
      const progressSimulation = async () => {
        for (let progress = 30; progress <= 70; progress += 3) {
          setUploadProgress(progress)
          console.log('UploadStatementModal: Processing progress:', progress + '%')
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // Wait for both the API call and progress simulation to complete
      console.log('UploadStatementModal: Waiting for API call and progress simulation to complete')
      await Promise.all([apiCallPromise, progressSimulation()])

      console.log('UploadStatementModal: Upload API call completed successfully')

      // Stage 3: Complete (70-100%)
      console.log('UploadStatementModal: Setting stage to complete')
      setUploadStage('complete')

      console.log('UploadStatementModal: Upload completed, finishing progress')

      // Final progress completion
      for (let progress = 70; progress <= 100; progress += 10) {
        setUploadProgress(progress)
        console.log('UploadStatementModal: Completion progress:', progress + '%')
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log('UploadStatementModal: Progress completed at 100%')

      // Wait a moment to show completion, then close
      console.log('UploadStatementModal: Showing completion message for 1.5 seconds before closing')
      setTimeout(() => {
        console.log('UploadStatementModal: Closing modal and resetting state')
        onClose()
        resetState()
      }, 1500)

    } catch (error) {
      console.error('UploadStatementModal: Upload error:', error)
      console.log('UploadStatementModal: Error details:', error instanceof Error ? error.message : 'Unknown error')
      console.log('UploadStatementModal: Resetting states due to error')
      setUploading(false)
      setUploadProgress(0)
      setUploadStage('uploading')
      // Don't close modal on error so user can retry
    }
  }

  const resetState = () => {
    console.log('UploadStatementModal: Resetting state')
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStage('uploading')
    setUploading(false)
  }

  const resetFile = () => {
    if (!uploading) {
      console.log('UploadStatementModal: Resetting file selection')
      resetState()
    }
  }

  const getProgressText = () => {
    const text = (() => {
      switch (uploadStage) {
        case 'uploading':
          return 'Uploading file...'
        case 'processing':
          return 'Processing transactions...'
        case 'complete':
          return 'Upload completed!'
        default:
          return 'Processing...'
      }
    })()
    console.log('UploadStatementModal: Progress text:', text)
    return text
  }

  const getProgressIcon = () => {
    switch (uploadStage) {
      case 'uploading':
        return <Upload className="w-4 h-4" />
      case 'processing':
        return <Clock className="w-4 h-4" />
      case 'complete':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Upload className="w-4 h-4" />
    }
  }

  // Log when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      console.log('UploadStatementModal: Modal opened')
    } else {
      console.log('UploadStatementModal: Modal closed, resetting state')
      resetState()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={!uploading ? onClose : undefined}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload a PDF or CSV file of your bank statement to import transactions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {dragActive ? 'Drop your file here' : 'Upload your statement'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={uploading}>
                  <span>Choose File</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, CSV, JPG, PNG files up to 1MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && (
                  <Button variant="ghost" size="sm" onClick={resetFile}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {console.log('UploadStatementModal: Checking if progress section should render - uploading:', uploading, 'uploadProgress:', uploadProgress)}
              {uploading && (
                <div className="space-y-3">
                  {console.log('UploadStatementModal: Rendering progress section with uploadProgress:', uploadProgress, 'uploadStage:', uploadStage)}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getProgressIcon()}
                      <span>{getProgressText()}</span>
                    </div>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>

                  {console.log('UploadStatementModal: About to render Progress component with value:', uploadProgress)}
                  <div className="w-full">
                    <Progress
                      value={uploadProgress}
                      className="h-2 w-full bg-gray-200"
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        border: '1px solid #d1d5db'
                      }}
                    />
                    {console.log('UploadStatementModal: Progress component rendered with value:', uploadProgress)}
                  </div>

                  {uploadStage === 'processing' && (
                    <div className="text-xs text-muted-foreground text-center">
                      This may take a moment for large files...
                    </div>
                  )}

                  {uploadProgress === 100 && uploadStage === 'complete' && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Statement uploaded successfully!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              {!uploading && (
                <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Statement
                </Button>
              )}
            </div>
          )}

          {/* Information */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-1">
              What happens next?
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Your statement will be uploaded securely</li>
              <li>• Transactions will be extracted and categorized automatically</li>
              <li>• You'll be able to review the imported data in your transactions</li>
              <li>• Large files may take longer to process</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}