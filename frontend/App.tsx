import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { DriveProvider } from './contexts/DriveContext';
import { RecordingProvider } from './contexts/RecordingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/spinner';
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
        <LoadingSpinner text="Loading..." />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary>
        <AppProvider>
          <DriveProvider>
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
          </DriveProvider>
        </AppProvider>
      </ErrorBoundary>
    </div>
  );
}
