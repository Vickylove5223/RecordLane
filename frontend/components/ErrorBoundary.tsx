import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Download,
  Bug,
  Clock,
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ErrorHandler, ErrorInfo } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  isolateError?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
  isRetrying: boolean;
  retryCount: number;
  connectionStatus: 'online' | 'offline' | 'checking';
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryService = new RetryService();
  private maxRetries = 3;
  private connectionCheckInterval?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: '',
      isRetrying: false,
      retryCount: 0,
      connectionStatus: 'online',
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Enhanced error logging
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
      state: this.state,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      memoryUsage: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : null,
    };

    // Log to our error handler
    ErrorHandler.logError('REACT_ERROR_BOUNDARY', error, {
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Store error data for potential reporting
    try {
      const existingErrors = JSON.parse(localStorage.getItem('recordlane-error-reports') || '[]');
      existingErrors.unshift(errorData);
      localStorage.setItem('recordlane-error-reports', JSON.stringify(existingErrors.slice(0, 10)));
    } catch (storageError) {
      console.warn('Failed to store error report:', storageError);
    }

    this.setState({ error, errorInfo });
    this.checkConnectionStatus();
    this.startConnectionMonitoring();
  }

  componentDidMount() {
    this.checkConnectionStatus();
    this.startConnectionMonitoring();
  }

  componentWillUnmount() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }
  }

  checkConnectionStatus = async () => {
    this.setState({ connectionStatus: 'checking' });
    
    try {
      // Test connection with multiple endpoints
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://googleapis.com',
        'https://accounts.google.com',
      ];

      const connectionTests = testUrls.map(url => 
        fetch(url, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        }).then(() => true).catch(() => false)
      );

      const results = await Promise.all(connectionTests);
      const isOnline = results.some(result => result) || navigator.onLine;
      
      this.setState({ 
        connectionStatus: isOnline ? 'online' : 'offline' 
      });
    } catch (error) {
      this.setState({ connectionStatus: 'offline' });
    }
  };

  startConnectionMonitoring = () => {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Check connection every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnectionStatus();
    }, 30000);

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.setState({ connectionStatus: 'online' });
    });

    window.addEventListener('offline', () => {
      this.setState({ connectionStatus: 'offline' });
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    try {
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the error might be connection related
      if (this.state.connectionStatus === 'offline') {
        await this.checkConnectionStatus();
        if (this.state.connectionStatus === 'offline') {
          throw new Error('No internet connection');
        }
      }

      // Clear error state and retry
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
      });

    } catch (retryError) {
      console.error('Retry failed:', retryError);
      ErrorHandler.logError('ERROR_BOUNDARY_RETRY_FAILED', retryError, {
        originalError: this.state.error,
        retryCount: this.state.retryCount,
      });
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  handleDownloadErrorReport = () => {
    try {
      const errorReport = {
        error: {
          name: this.state.error?.name,
          message: this.state.error?.message,
          stack: this.state.error?.stack,
        },
        errorInfo: this.state.errorInfo,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        connectionStatus: this.state.connectionStatus,
        retryCount: this.state.retryCount,
        appState: {
          localStorage: this.getLocalStorageData(),
          sessionStorage: this.getSessionStorageData(),
        },
      };

      const blob = new Blob([JSON.stringify(errorReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recordlane-error-report-${this.state.errorId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error('Failed to download error report:', downloadError);
    }
  };

  getLocalStorageData = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('recordlane-')) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      return data;
    } catch (error) {
      return {};
    }
  };

  getSessionStorageData = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('recordlane-')) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    } catch (error) {
      return {};
    }
  };

  getErrorSeverity = (): 'low' | 'medium' | 'high' | 'critical' => {
    if (!this.state.error) return 'medium';
    return ErrorHandler.getErrorSeverity(this.state.error);
  };

  getErrorSuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    if (this.state.connectionStatus === 'offline') {
      suggestions.push('Check your internet connection');
      suggestions.push('Try connecting to a different network');
    }
    
    if (this.state.error?.name === 'ChunkLoadError') {
      suggestions.push('Clear your browser cache');
      suggestions.push('Disable browser extensions temporarily');
    }
    
    if (this.state.error?.message?.includes('Google')) {
      suggestions.push('Check if Google services are accessible');
      suggestions.push('Try signing out and back into your Google account');
    }
    
    if (this.state.retryCount > 0) {
      suggestions.push('Try reloading the page completely');
      suggestions.push('Close other tabs to free up memory');
    }
    
    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const suggestions = this.getErrorSuggestions();
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                Something went wrong
                <Badge variant={severity === 'critical' ? 'destructive' : severity === 'high' ? 'destructive' : 'secondary'}>
                  {severity}
                </Badge>
              </CardTitle>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(this.state.lastErrorTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  {this.state.connectionStatus === 'online' ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : this.state.connectionStatus === 'offline' ? (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Monitor className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="capitalize">{this.state.connectionStatus}</span>
                </div>
                {this.state.retryCount > 0 && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    <span>{this.state.retryCount} retries</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  RecordLane encountered an unexpected error and needs to restart.
                </p>
                <p className="text-sm">
                  {this.state.connectionStatus === 'offline' 
                    ? 'Please check your internet connection and try again.'
                    : 'If this keeps happening, please try the suggestions below.'
                  }
                </p>
              </div>

              {/* Error ID */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <strong>Error ID:</strong> <code className="bg-background px-1 rounded">{this.state.errorId}</code>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggestions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <ScrollArea className="h-32">
                  <details className="p-3 bg-muted rounded-lg text-sm">
                    <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Error Details (Development)
                    </summary>
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong>Error:</strong>
                        <pre className="mt-1 overflow-auto bg-background p-2 rounded">{this.state.error.toString()}</pre>
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 overflow-auto bg-background p-2 rounded">{this.state.error.stack}</pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 overflow-auto bg-background p-2 rounded">{this.state.errorInfo.componentStack}</pre>
                        </div>
                      )}
                    </div>
                  </details>
                </ScrollArea>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    variant="outline"
                    className="flex-1"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again ({this.maxRetries - this.state.retryCount} left)
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={this.handleHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              {/* Additional Actions */}
              <div className="flex justify-center pt-2">
                <Button
                  onClick={this.handleDownloadErrorReport}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Error Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for isolated error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} isolateError={true}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for accessing error boundary context
export function useErrorHandler() {
  return {
    logError: ErrorHandler.logError,
    createError: ErrorHandler.createError,
    getErrorLog: ErrorHandler.getErrorLog,
    clearErrorLog: ErrorHandler.clearErrorLog,
  };
}
