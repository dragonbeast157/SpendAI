import { api } from './index'

export interface LogEntry {
  _id: string
  userId: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata?: any
  timestamp: Date
  source: string
  component?: string
}

export interface LogQueryParams {
  level?: 'info' | 'warn' | 'error' | 'debug'
  source?: string
  component?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
  search?: string
}

export interface LogResponse {
  logs: LogEntry[]
  totalCount: number
  currentPage: number
  totalPages: number
  hasMore: boolean
}

export const getLogs = async (params: LogQueryParams = {}): Promise<LogResponse> => {
  try {
    console.log('API: Fetching logs with params:', params)
    const response = await api.get('/logs', { params })
    console.log('API: Logs response received:', response.data)
    return response.data
  } catch (error: any) {
    console.error('API: Error fetching logs:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch logs')
  }
}

export const createLog = async (logData: Omit<LogEntry, '_id' | 'userId' | 'timestamp'>): Promise<LogEntry> => {
  try {
    console.log('API: Creating log entry:', logData)
    const response = await api.post('/logs', logData)
    console.log('API: Log created successfully:', response.data)
    return response.data.log
  } catch (error: any) {
    console.error('API: Error creating log:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to create log entry')
  }
}

export const deleteLog = async (logId: string): Promise<void> => {
  try {
    console.log('API: Deleting log with ID:', logId)
    await api.delete(`/logs/${logId}`)
    console.log('API: Log deleted successfully')
  } catch (error: any) {
    console.error('API: Error deleting log:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to delete log entry')
  }
}

export const clearLogs = async (params: { level?: string; source?: string; beforeDate?: string } = {}): Promise<void> => {
  try {
    console.log('API: Clearing logs with params:', params)
    await api.delete('/logs', { params })
    console.log('API: Logs cleared successfully')
  } catch (error: any) {
    console.error('API: Error clearing logs:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to clear logs')
  }
}

export const exportLogs = async (params: LogQueryParams & { format?: 'json' | 'csv' } = {}): Promise<void> => {
  try {
    console.log('API: Exporting logs with params:', params)
    const response = await api.get('/logs/export', { 
      params,
      responseType: 'blob'
    })
    
    // Create download link
    const blob = new Blob([response.data], { 
      type: params.format === 'csv' ? 'text/csv' : 'application/json' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${new Date().toISOString().split('T')[0]}.${params.format || 'json'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('API: Logs exported successfully')
  } catch (error: any) {
    console.error('API: Error exporting logs:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to export logs')
  }
}

export const getLogStats = async (): Promise<{
  totalLogs: number
  logsByLevel: Record<string, number>
  logsBySource: Record<string, number>
  recentActivity: { date: string; count: number }[]
}> => {
  try {
    console.log('API: Fetching log statistics')
    const response = await api.get('/logs/stats')
    console.log('API: Log stats response received:', response.data)
    return response.data
  } catch (error: any) {
    console.error('API: Error fetching log stats:', error)
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch log statistics')
  }
}