import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { YouTubeProvider } from './contexts/YouTubeContext';
import { RecordingProvider } from './contexts/RecordingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/spinner';
import './App.css';

// Lazy load main components for better performance
const AppShell = lazy(() => import('./components/AppShell'));
const YouTubeSetupPage = lazy(() => import('./components/setup/YouTubeSetupPage'));
const VideoSharePage = lazy(() => import('./components/pages/VideoSharePage'));

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Starting app initialization...');
    
    const initializeApp = async () => {
      try {
        console.log('✅ App initialization started');
        
        // Simple initialization without complex dependencies
        setIsInitialized(true);
        console.log('✅ App initialization completed');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        setIsInitialized(true); // Continue anyway
      }
    };

    // Initialize immediately
    initializeApp();
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Initialization Error</h1>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <AppLoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <YouTubeProvider>
          <RecordingProvider>
            <Router>
              <Suspense fallback={<AppLoadingFallback />}>
                <Routes>
                  <Route path="/video/:recordingId" element={<VideoSharePage />} />
                  <Route path="/setup" element={<YouTubeSetupPage />} />
                  <Route path="*" element={<AppShell />} />
                </Routes>
              </Suspense>
              <Toaster />
            </Router>
          </RecordingProvider>
        </YouTubeProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  console.log('🎯 App component rendering...');
  
  return (
    <div className="App">
      <AppInner />
    </div>
  );
}
