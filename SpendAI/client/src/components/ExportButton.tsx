import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportUserData } from '@/api/settings'
import { useToast } from '@/hooks/useToast'

interface ExportButtonProps {
  format: 'json' | 'csv'
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function ExportButton({ 
  format, 
  variant = 'outline', 
  size = 'default', 
  className = '',
  children 
}: ExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      console.log('ExportButton: handleExport called with format:', format)
      console.log('ExportButton: isExporting state before:', isExporting)
      setIsExporting(true)
      console.log('ExportButton: About to call exportUserData API function')
      await exportUserData({ format })
      console.log('ExportButton: exportUserData completed successfully')
      toast({
        title: 'Data exported',
        description: `Your data has been exported as ${format.toUpperCase()} and downloaded successfully`
      })
    } catch (error: any) {
      console.error('ExportButton: Export failed with error:', error)
      console.error('ExportButton: Export error message:', error.message)
      console.error('ExportButton: Export error stack:', error.stack)
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive'
      })
    } finally {
      console.log('ExportButton: Setting isExporting to false')
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="h-4 w-4 mr-2" />
      {children || (isExporting ? `Exporting ${format.toUpperCase()}...` : `Export as ${format.toUpperCase()}`)}
    </Button>
  )
}