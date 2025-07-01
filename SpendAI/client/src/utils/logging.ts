// Logging utility for client-side debugging and monitoring

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  component?: string
  userId?: string
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO
  private logs: LogEntry[] = []
  private maxLogs: number = 1000

  constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      this.logLevel = LogLevel.DEBUG
    } else {
      this.logLevel = LogLevel.WARN
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]
    const prefix = component ? `[${component}]` : ''
    return `${timestamp} ${levelName} ${prefix} ${message}`
  }

  private addToHistory(entry: LogEntry): void {
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  debug(message: string, data?: any, component?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
      component
    }

    this.addToHistory(entry)
    console.log(this.formatMessage(LogLevel.DEBUG, message, component), data || '')
  }

  info(message: string, data?: any, component?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
      component
    }

    this.addToHistory(entry)
    console.log(this.formatMessage(LogLevel.INFO, message, component), data || '')
  }

  warn(message: string, data?: any, component?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
      component
    }

    this.addToHistory(entry)
    console.warn(this.formatMessage(LogLevel.WARN, message, component), data || '')
  }

  error(message: string, error?: any, component?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data: error,
      component
    }

    this.addToHistory(entry)
    
    if (error) {
      console.error(this.formatMessage(LogLevel.ERROR, message, component), error)
      
      // Log full error details if available
      if (error.stack) {
        console.error('Stack trace:', error.stack)
      }
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
        console.error('Response headers:', error.response.headers)
      }
    } else {
      console.error(this.formatMessage(LogLevel.ERROR, message, component))
    }
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, data?: any, component?: string): void {
    this.debug(`API Request: ${method.toUpperCase()} ${url}`, data, component || 'API')
  }

  apiResponse(method: string, url: string, status: number, data?: any, component?: string): void {
    const message = `API Response: ${method.toUpperCase()} ${url} - ${status}`
    if (status >= 400) {
      this.error(message, data, component || 'API')
    } else {
      this.debug(message, data, component || 'API')
    }
  }

  apiError(method: string, url: string, error: any, component?: string): void {
    const message = `API Error: ${method.toUpperCase()} ${url}`
    this.error(message, error, component || 'API')
  }

  // Component lifecycle logging
  componentMount(componentName: string, props?: any): void {
    this.debug(`Component mounted: ${componentName}`, props, componentName)
  }

  componentUnmount(componentName: string): void {
    this.debug(`Component unmounted: ${componentName}`, undefined, componentName)
  }

  componentUpdate(componentName: string, updates?: any): void {
    this.debug(`Component updated: ${componentName}`, updates, componentName)
  }

  // User action logging
  userAction(action: string, data?: any, component?: string): void {
    this.info(`User action: ${action}`, data, component || 'UserAction')
  }

  // Navigation logging
  navigationStart(from: string, to: string): void {
    this.info(`Navigation: ${from} -> ${to}`, undefined, 'Navigation')
  }

  navigationComplete(route: string): void {
    this.debug(`Navigation complete: ${route}`, undefined, 'Navigation')
  }

  // Performance logging
  performanceStart(operation: string): string {
    const startTime = performance.now()
    const operationId = `${operation}_${Date.now()}`
    this.debug(`Performance start: ${operation}`, { operationId, startTime }, 'Performance')
    return operationId
  }

  performanceEnd(operationId: string, operation: string): void {
    const endTime = performance.now()
    const duration = endTime - (performance.getEntriesByName(operationId)[0]?.startTime || endTime)
    this.info(`Performance end: ${operation}`, { operationId, duration: `${duration.toFixed(2)}ms` }, 'Performance')
  }

  // Get logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level)
    }
    return [...this.logs]
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
    this.info('Logs cleared', undefined, 'Logger')
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Set user context for logging
  setUserId(userId: string): void {
    this.logs.forEach(log => {
      if (!log.userId) {
        log.userId = userId
      }
    })
  }
}

// Create singleton instance
const logger = new Logger()

export default logger

// Convenience exports
export const logDebug = logger.debug.bind(logger)
export const logInfo = logger.info.bind(logger)
export const logWarn = logger.warn.bind(logger)
export const logError = logger.error.bind(logger)
export const logApiRequest = logger.apiRequest.bind(logger)
export const logApiResponse = logger.apiResponse.bind(logger)
export const logApiError = logger.apiError.bind(logger)
export const logUserAction = logger.userAction.bind(logger)
export const logNavigation = logger.navigationStart.bind(logger)
export const logPerformance = logger.performanceStart.bind(logger)