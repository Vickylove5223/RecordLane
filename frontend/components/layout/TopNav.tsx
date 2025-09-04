import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/spinner';
import { Settings, Circle } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import FloatingRecordButton from '../recording/FloatingRecordButton';

export default function TopNav() {
  const { userEmail, isConnecting } = useYouTube();
  const { dispatch } = useApp();
  const { state: recordingState } = useRecording();
  const [showSettings, setShowSettings] = useState(false);

  const handleSettingsClick = () => {
    dispatch({ type: 'SET_SETTINGS_OPEN', payload: true });
  };

  const showRecordButton = recordingState !== 'recording' && recordingState !== 'paused' && recordingState !== 'starting';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-primary-foreground rounded-full"></div>
          </div>
          <span className="font-semibold text-lg">RecordLane</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        {/* Record Button - Only show when not recording */}
        {showRecordButton && (
          <div className="relative">
            <FloatingRecordButton />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSettingsClick}
          disabled={isConnecting}
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        {isConnecting ? (
          <LoadingSpinner size="sm" />
        ) : userEmail ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`} />
            <AvatarFallback>
              {userEmail.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        )}
      </div>
    </header>
  );
}
