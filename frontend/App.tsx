import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { YouTubeProvider } from './contexts/YouTubeContext';
import { RecordingProvider } from './contexts/RecordingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

// Import components directly (no lazy loading)
import AppShell from './components/AppShell';
import YouTubeSetupPage from './components/setup/YouTubeSetupPage';
import VideoSharePage from './components/pages/VideoSharePage';

function AppInner() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <YouTubeProvider>
          <RecordingProvider>
            <Router>
              <Routes>
                <Route path="/video/:recordingId" element={<VideoSharePage />} />
                <Route path="/setup" element={<YouTubeSetupPage />} />
                <Route path="*" element={<AppShell />} />
              </Routes>
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