import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

// Lazy load ALL components including contexts
const AppProvider = lazy(() => import('./contexts/AppContext').then(m => ({ default: m.AppProvider })));
const YouTubeProvider = lazy(() => import('./contexts/YouTubeContext').then(m => ({ default: m.YouTubeProvider })));
const RecordingProvider = lazy(() => import('./contexts/RecordingContext').then(m => ({ default: m.RecordingProvider })));
const ErrorBoundary = lazy(() => import('./components/ErrorBoundary').then(m => ({ default: m.ErrorBoundary })));
const AppShell = lazy(() => import('./components/AppShell'));
const YouTubeSetupPage = lazy(() => import('./components/setup/YouTubeSetupPage'));
const VideoSharePage = lazy(() => import('./components/pages/VideoSharePage'));

function MinimalLoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-2"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function AppInner() {
  return (
    <Suspense fallback={<MinimalLoadingFallback />}>
      <ErrorBoundary>
        <Suspense fallback={<MinimalLoadingFallback />}>
          <AppProvider>
            <Suspense fallback={<MinimalLoadingFallback />}>
              <YouTubeProvider>
                <Suspense fallback={<MinimalLoadingFallback />}>
                  <RecordingProvider>
                    <Router>
                      <Suspense fallback={<MinimalLoadingFallback />}>
                        <Routes>
                          <Route path="/video/:recordingId" element={<VideoSharePage />} />
                          <Route path="/setup" element={<YouTubeSetupPage />} />
                          <Route path="*" element={<AppShell />} />
                        </Routes>
                      </Suspense>
                      <Toaster />
                    </Router>
                  </RecordingProvider>
                </Suspense>
              </YouTubeProvider>
            </Suspense>
          </AppProvider>
        </Suspense>
      </ErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  return (
    <div className="App">
      <AppInner />
    </div>
  );
}
