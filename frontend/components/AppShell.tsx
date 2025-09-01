import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './layout/TopNav';
import Sidebar from './layout/Sidebar';
import MainPanel from './layout/MainPanel';
import FloatingRecordButton from './recording/FloatingRecordButton';
import RecordingOverlay from './recording/RecordingOverlay';
import OnboardingModal from './onboarding/OnboardingModal';
import ReviewPanel from './recording/ReviewPanel';
import ShareModal from './sharing/ShareModal';
import SettingsModal from './settings/SettingsModal';
import { useApp } from '../contexts/AppContext';
import { useRecording } from '../contexts/RecordingContext';

export default function AppShell() {
  const { state } = useApp();
  const { state: recordingState } = useRecording();

  return (
    <div className="flex h-screen bg-background">
      {/* Navigation */}
      <TopNav />
      
      {/* Main Layout */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="*" element={<MainPanel />} />
          </Routes>
        </main>
      </div>

      {/* Floating Record Button */}
      {recordingState !== 'recording' && recordingState !== 'paused' && recordingState !== 'starting' && (
        <FloatingRecordButton />
      )}

      {/* Recording Overlay */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <RecordingOverlay />
      )}

      {/* Review Panel */}
      {recordingState === 'stopped' && <ReviewPanel />}

      {/* Modals */}
      {!state.isOnboarded && <OnboardingModal />}
      <ShareModal />
      <SettingsModal />
    </div>
  );
}
