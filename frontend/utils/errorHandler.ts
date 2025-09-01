export interface ErrorInfo {
  code: string;
  message: string;
  originalError?: any;
  context?: Record<string, any>;
  timestamp: number;
  userAgent: string;
  url: string;
}

export class AppError extends Error {
  public code: string;
  public originalError?: any;
  public context?: Record<string, any>;
  public timestamp: number;

  constructor(code: string, message: string, originalError?: any, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = Date.now();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  public toErrorInfo(): ErrorInfo {
    return {
      code: this.code,
      message: this.message,
      originalError: this.originalError,
      context: this.context,
      timestamp: this.timestamp,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }
}

export class ErrorHandler {
  private static errorLog: ErrorInfo[] = [];
  private static maxLogSize = 100;
  private static listeners: Array<(error: ErrorInfo) => void> = [];

  // Create a structured error
  static createError(code: string, message: string, originalError?: any, context?: Record<string, any>): AppError {
    return new AppError(code, message, originalError, context);
  }

  // Log an error
  static logError(code: string, error: any, context?: Record<string, any>): void {
    const errorInfo: ErrorInfo = {
      code,
      message: error?.message || String(error),
      originalError: error,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to log
    this.errorLog.unshift(errorInfo);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('recordlane-error-log', JSON.stringify(this.errorLog.slice(0, 20)));
    } catch (e) {
      // Ignore storage errors
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔴 RecordLane Error: ${code}`);
      console.error('Message:', errorInfo.message);
      console.error('Original Error:', error);
      console.error('Context:', context);
      console.error('Stack:', error?.stack);
      console.groupEnd();
    }
  }

  // Add error listener
  static addErrorListener(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get error log
  static getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  // Clear error log
  static clearErrorLog(): void {
    this.errorLog = [];
    try {
      localStorage.removeItem('recordlane-error-log');
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Load error log from storage
  static loadErrorLog(): void {
    try {
      const stored = localStorage.getItem('recordlane-error-log');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.errorLog = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('Failed to load error log from storage:', e);
      this.errorLog = [];
    }
  }

  // Format error for display
  static formatErrorForUser(error: any): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error?.code) {
      switch (error.code) {
        case 'CONNECTION_FAILED':
          return 'Failed to connect to Google Drive. Please check your internet connection and try again.';
        case 'PERMISSIONS_DENIED':
          return 'Camera or screen sharing permissions were denied. Please allow access and try again.';
        case 'UPLOAD_FAILED':
          return 'Failed to upload recording to Google Drive. Please check your connection and try again.';
        case 'RECORDING_FAILED':
          return 'Failed to start recording. Please check your browser permissions and try again.';
        case 'QUOTA_EXCEEDED':
          return 'Your Google Drive storage is full. Please free up space and try again.';
        case 'BROWSER_NOT_SUPPORTED':
          return 'Your browser does not support screen recording. Please use Chrome, Edge, or Firefox.';
        default:
          return error.message || 'An unexpected error occurred. Please try again.';
      }
    }

    return error?.message || 'An unexpected error occurred. Please try again.';
  }

  // Check if error is recoverable
  static isRecoverableError(error: any): boolean {
    const recoverableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_FAILURE',
    ];

    if (error instanceof AppError) {
      return recoverableCodes.includes(error.code);
    }

    if (error?.name === 'NetworkError' || error?.name === 'TimeoutError') {
      return true;
    }

    return false;
  }

  // Get error severity
  static getErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCodes = ['ENCRYPTION_FAILED', 'DATA_CORRUPTION'];
    const highCodes = ['RECORDING_FAILED', 'UPLOAD_FAILED', 'CONNECTION_FAILED'];
    const mediumCodes = ['PERMISSIONS_DENIED', 'QUOTA_EXCEEDED'];

    if (error instanceof AppError) {
      if (criticalCodes.includes(error.code)) return 'critical';
      if (highCodes.includes(error.code)) return 'high';
      if (mediumCodes.includes(error.code)) return 'medium';
      return 'low';
    }

    if (error?.name === 'TypeError' || error?.name === 'ReferenceError') {
      return 'high';
    }

    return 'medium';
  }

  // Initialize error handling
  static initialize(): void {
    // Load existing error log
    this.loadErrorLog();

    // Set up global error handlers
    window.addEventListener('error', (event) => {
      this.logError('GLOBAL_ERROR', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('UNHANDLED_PROMISE_REJECTION', event.reason, {
        promise: event.promise,
      });
    });

    // Set up console error interception (development only)
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('RecordLane')) {
          // Don't double-log our own errors
          return originalConsoleError.apply(console, args);
        }
        
        this.logError('CONSOLE_ERROR', args.join(' '), { args });
        return originalConsoleError.apply(console, args);
      };
    }
  }
}

// Initialize error handling
ErrorHandler.initialize();
