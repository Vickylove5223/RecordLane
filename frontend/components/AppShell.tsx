import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './layout/TopNav';
import MainPanel from './layout/MainPanel';
import OnboardingModal from './onboarding/OnboardingModal';
import ReviewPanel from './recording/ReviewPanel';
import ShareModal from './sharing/ShareModal';
import SettingsModal from './settings/SettingsModal';
import ClickHighlighter from './recording/ClickHighlighter';
import DrawingOverlay from './recording/DrawingOverlay';
import ScreenshotFlash from './recording/ScreenshotFlash';
import { useApp } from '../contexts/AppContext';
import { useRecording } from '../contexts/RecordingContext';

export default function AppShell() {
  const { state } = useApp();
  const { state: recordingState, options, updateOptions } = useRecording();

  return (
    <div className="flex h-screen bg-background">
      {/* Navigation */}
      <TopNav />
      
      {/* Main Layout */}
      <div className="flex flex-1 pt-16">
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="*" element={<MainPanel />} />
          </Routes>
        </main>
      </div>

      {/* Review Panel */}
      {recordingState === 'stopped' && <ReviewPanel />}

      {/* Visual Effects - Only active during recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <>
          <ClickHighlighter enabled={options.highlightClicks} />
          <DrawingOverlay 
            enabled={options.enableDrawing} 
            onDisable={() => updateOptions({ enableDrawing: false })}
          />
        </>
      )}

      {/* Screenshot Flash Effect */}
      <ScreenshotFlash trigger={false} />

      {/* Modals */}
      {!state.isOnboarded && <OnboardingModal />}
      <ShareModal />
      <SettingsModal />
    </div>
  );
}
