import { useState, useCallback } from 'react'
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

// Add console log to verify Progress component import
console.log('StatementUploadModal: Progress component type:', typeof Progress)
console.log('StatementUploadModal: Progress component:', Progress)

interface StatementUploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

export function StatementUploadModal({ open, onClose, onUpload }: StatementUploadModalProps) {
  console.log('StatementUploadModal: Component rendered with open:', open)
  console.log('StatementUploadModal: This is the MAIN modal component we have been debugging!')
  console.log('StatementUploadModal: onUpload function provided:', typeof onUpload)
  console.log('StatementUploadModal: onClose function provided:', typeof onClose)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing' | 'complete'>('uploading')
  const [dragActive, setDragActive] = useState(false)

  console.log('StatementUploadModal: Current state - uploading:', uploading, 'selectedFile:', selectedFile?.name || 'none')

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
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setUploadProgress(0)
      setUploadStage('uploading')

      console.log('Frontend: Starting file upload progress simulation')

      // Stage 1: File upload simulation (0-40%)
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 40) {
            clearInterval(uploadInterval)
            return 40
          }
          return prev + 5
        })
      }, 100)

      // Wait a bit to show upload progress
      await new Promise(resolve => setTimeout(resolve, 800))
      clearInterval(uploadInterval)
      setUploadProgress(40)

      console.log('Frontend: File upload stage complete, starting processing')

      // Stage 2: Processing stage (40-90%)
      setUploadStage('processing')
      const processingInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(processingInterval)
            return 90
          }
          return prev + 2
        })
      }, 150)

      // Start the actual upload
      console.log('Frontend: Calling onUpload function')
      await onUpload(selectedFile)

      // Stage 3: Complete (90-100%)
      clearInterval(processingInterval)
      setUploadProgress(95)
      setUploadStage('complete')

      console.log('Frontend: Upload completed, finishing progress')
      
      // Final progress completion
      setTimeout(() => {
        setUploadProgress(100)
        setTimeout(() => {
          onClose()
          resetState()
        }, 1000)
      }, 500)

    } catch (error) {
      console.error('Frontend: Upload error:', error)
      setUploading(false)
      setUploadProgress(0)
      setUploadStage('uploading')
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStage('uploading')
    setUploading(false)
  }

  const resetFile = () => {
    if (!uploading) {
      resetState()
    }
  }

  const getProgressText = () => {
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

  return (
    <Dialog open={open} onOpenChange={!uploading ? onClose : undefined}>
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
              {console.log('StatementUploadModal: Rendering file selected section')}
              {console.log('StatementUploadModal: uploading state:', uploading)}
              {console.log('StatementUploadModal: uploadProgress:', uploadProgress)}
              
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

              {/* ALWAYS VISIBLE DEBUG SECTION */}
              <div className="p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                <h4 className="font-bold text-yellow-800 mb-2">DEBUG INFO (Always Visible)</h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <div>uploading: {uploading ? 'TRUE' : 'FALSE'}</div>
                  <div>uploadProgress: {uploadProgress}%</div>
                  <div>uploadStage: {uploadStage}</div>
                  <div>selectedFile: {selectedFile?.name || 'none'}</div>
                </div>
              </div>

              {/* Conditional Upload Progress - WITH EXPLICIT LOGGING */}
              {console.log('StatementUploadModal: About to check uploading condition:', uploading)}
              {uploading ? (
                <div className="space-y-3 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
                  {console.log('StatementUploadModal: PROGRESS SECTION IS RENDERING!')}
                  <h4 className="font-bold text-green-800">UPLOAD IN PROGRESS</h4>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getProgressIcon()}
                      <span>{getProgressText()}</span>
                    </div>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>

                  {/* Multiple Progress Bar Implementations */}
                  <div className="space-y-2">
                    {/* Custom CSS Progress Bar */}
                    <div>
                      <div className="text-xs mb-1">Custom Progress Bar:</div>
                      <div className="w-full bg-gray-300 rounded-full h-4 border-2 border-gray-500">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Shadcn Progress Bar */}
                    <div>
                      <div className="text-xs mb-1">Shadcn Progress Bar:</div>
                      <Progress value={uploadProgress} className="h-4" />
                    </div>

                    {/* Simple HTML Progress Element */}
                    <div>
                      <div className="text-xs mb-1">HTML Progress Element:</div>
                      <progress value={uploadProgress} max="100" className="w-full h-4">
                        {uploadProgress}%
                      </progress>
                    </div>
                  </div>

                  {uploadStage === 'processing' && (
                    <div className="text-xs text-muted-foreground text-center">
                      This may take a moment for large files...
                    </div>
                  )}

                  {uploadProgress === 100 && (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-4 w-4" />
                      <span className="text-sm font-medium">Upload completed successfully!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                  {console.log('StatementUploadModal: PROGRESS SECTION IS NOT RENDERING - uploading is false')}
                  <h4 className="font-bold text-red-800">UPLOAD NOT IN PROGRESS</h4>
                  <div className="text-sm text-red-800">
                    The uploading state is currently FALSE, so progress bar is not shown.
                  </div>
                </div>
              )}

              {/* Upload Button */}
              {!uploading && (
                <Button onClick={() => {
                  console.log('StatementUploadModal: Upload button clicked - calling handleUpload')
                  handleUpload()
                }} className="w-full" disabled={uploading}>
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