import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { DriveProvider } from './contexts/DriveContext';
import { RecordingProvider } from './contexts/RecordingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/spinner';
import { performanceMonitor, usePerformanceMonitor } from './utils/performanceMonitor';
import { GlobalCacheManager } from './utils/cacheService';
import { ErrorHandler } from './utils/errorHandler';
import { analytics } from './utils/analyticsService';
import './App.css';

// Lazy load main components for better performance
const AppShell = lazy(() => import('./components/AppShell'));

function AppLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold mb-2">RecordLane</h1>
        <LoadingSpinner text="Loading application..." />
      </div>
    </div>
  );
}

function AppInner() {
  const { metrics, markStart, markEnd, getOptimizationSuggestions } = usePerformanceMonitor();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSuggestionLog, setLastSuggestionLog] = useState(0);

  useEffect(() => {
    // Mark app initialization start
    markStart('app-init');

    // Initialize application
    const initializeApp = async () => {
      try {
        // Warm up critical services
        await Promise.all([
          // Pre-initialize error handling
          ErrorHandler.initialize(),
          
          // Pre-warm cache system
          GlobalCacheManager.getInstance('app-cache'),
          
          // Initialize analytics
          analytics.initialize(),
          
          // Check browser compatibility
          checkBrowserCompatibility(),
        ]);

        setIsInitialized(true);
        markEnd('app-init');

      } catch (error) {
        console.error('App initialization failed:', error);
        ErrorHandler.logError('app-init-error', error);
        analytics.trackError('app_init_failed', error.message);
        setIsInitialized(true); // Continue anyway
        markEnd('app-init');
      }
    };

    initializeApp();

    // Set up performance monitoring with reduced frequency
    const unsubscribe = performanceMonitor.addObserver((newMetrics) => {
      const suggestions = getOptimizationSuggestions();
      const now = Date.now();
      
      // Only log suggestions once per minute to avoid spam
      if (suggestions.length > 0 && now - lastSuggestionLog > 60000) {
        if (process.env.NODE_ENV === 'development') {
          console.group('🔧 Performance Suggestions');
          suggestions.forEach(suggestion => console.warn(suggestion));
          console.groupEnd();
        }
        setLastSuggestionLog(now);
      }

      // Track performance metrics
      analytics.trackPerformance({
        fps: newMetrics.fps || 0,
        renderTime: newMetrics.renderTime || 0,
        memoryUsage: newMetrics.memoryUsage?.usedJSHeapSize || 0,
        cacheHitRate: newMetrics.cacheHitRate || 0,
      });
    });

    // Cleanup function
    return () => {
      unsubscribe();
      GlobalCacheManager.disposeAll();
      analytics.cleanup();
    };
  }, [markStart, markEnd, getOptimizationSuggestions, lastSuggestionLog]);

  // Display performance metrics in development (reduced frequency)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && metrics) {
      // Only log metrics every 30 seconds in development
      const interval = setInterval(() => {
        console.group('📊 Performance Metrics');
        console.log('FPS:', metrics.fps?.toFixed(1));
        console.log('Render Time:', metrics.renderTime?.toFixed(2), 'ms');
        console.log('Cache Hit Rate:', metrics.cacheHitRate?.toFixed(1), '%');
        if (metrics.memoryUsage) {
          console.log('Memory Usage:', (metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1), 'MB');
        }
        console.groupEnd();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [metrics]);

  if (!isInitialized) {
    return <AppLoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary>
        <AppProvider>
          <ErrorBoundary isolateError>
            <DriveProvider>
              <ErrorBoundary isolateError>
                <RecordingProvider>
                  <Router>
                    <Suspense fallback={<AppLoadingFallback />}>
                      <Routes>
                        <Route path="*" element={<AppShell />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </Router>
                </RecordingProvider>
              </ErrorBoundary>
            </DriveProvider>
          </ErrorBoundary>
        </AppProvider>
      </ErrorBoundary>
    </div>
  );
}

function checkBrowserCompatibility(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check for required APIs
    const requiredAPIs = {
      'MediaRecorder': typeof MediaRecorder !== 'undefined',
      'getUserMedia': !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      'getDisplayMedia': !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      'WebCrypto': !!(window.crypto && window.crypto.subtle),
      'fetch': typeof fetch !== 'undefined',
      'localStorage': typeof localStorage !== 'undefined',
    };

    const missingAPIs = Object.entries(requiredAPIs)
      .filter(([, supported]) => !supported)
      .map(([api]) => api);

    if (missingAPIs.length > 0) {
      const error = new Error(`Browser missing required APIs: ${missingAPIs.join(', ')}`);
      ErrorHandler.logError('browser-compatibility-error', error, { missingAPIs });
      analytics.trackError('browser_compatibility_error', error.message, { missingAPIs });
      
      // Don't reject - we'll handle this gracefully in the UI
      console.warn('Browser compatibility issues detected:', missingAPIs);
    }

    resolve();
  });
}

export default function App() {
  return <AppInner />;
}
