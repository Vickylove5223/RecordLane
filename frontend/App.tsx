import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { DriveProvider } from './contexts/DriveContext';
import { RecordingProvider } from './contexts/RecordingContext';
import AppShell from './components/AppShell';
import './App.css';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppProvider>
        <DriveProvider>
          <RecordingProvider>
            <Router>
              <Routes>
                <Route path="*" element={<AppShell />} />
              </Routes>
              <Toaster />
            </Router>
          </RecordingProvider>
        </DriveProvider>
      </AppProvider>
    </div>
  );
}
