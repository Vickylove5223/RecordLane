import React, { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, Wifi, Shield, Download, Zap, AlertTriangle, Play, ExternalLink, Clock } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import { withErrorBoundary } from '../ErrorBoundary';
import { withPerformanceMonitoring } from '../../utils/performanceMonitor';
import { formatDistanceToNow } from 'date-fns';
import VideoModal from './VideoModal';
import RecordingPanel from '../recording/RecordingPanel';

const RecordingCard = memo(({ recording, onClick }: { recording: any; onClick: () => void }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
    <CardContent className="p-4">
      <div className="aspect-video bg-muted rounded mb-3 flex items-center justify-center">
        {recording.thumbnail ? (
          <img
            src={recording.thumbnail}
            alt={recording.title}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        ) : (
          <Video className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-medium truncate mb-1">{recording.title}</h3>
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(recording.duration)}</span>
        </div>
        <span>{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {recording.uploadStatus === 'local' && (
            <div className="flex items-center text-xs text-blue-600">
              <Download className="h-3 w-3 mr-1" />
              <span>Local</span>
            </div>
          )}
          {recording.uploadStatus === 'completed' && recording.youtubeLink && (
            <div className="flex items-center text-xs text-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              <span>Synced</span>
            </div>
          )}
        </div>
        {recording.youtubeLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(recording.youtubeLink, '_blank');
            }}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
));

RecordingCard.displayName = 'RecordingCard';

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MainPanelComponent() {
  const { isConnected, isConnecting, connectionError, connectYouTube } = useYouTube();
  const { state } = useApp();
  const { state: recordingState } = useRecording();
  const [selectedRecording, setSelectedRecording] = useState(null);

  const getConnectionStatus = () => {
    if (connectionError) return 'error';
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionText = () => {
    if (connectionError) return `Error: ${connectionError}`;
    if (isConnecting) return 'Connecting to YouTube...';
    if (isConnected) return 'Connected to YouTube';
    return 'Not connected';
  };

  const handleRecordingClick = (recording: any) => {
    setSelectedRecording(recording);
  };

  const handleCloseModal = () => {
    setSelectedRecording(null);
  };

  return (
    <div className="flex-1 p-8">
      {/* Recording Panel - Always at the top when recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <RecordingPanel />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 mt-20">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Welcome to RecordLane</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Record your screen and camera with instant YouTube sync
          </p>

          {/* Connection Status */}
          <div className="mb-6">
            <ConnectionStatus 
              status={getConnectionStatus()}
              text={getConnectionText()}
              className="mx-auto"
            />
          </div>

          {/* Connect YouTube CTA */}
          {!isConnected && (
            <Card className="text-left mb-8 max-w-2xl mx-auto">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Wifi className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Connect YouTube for Cloud Sync</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You can record immediately! Connect YouTube later to automatically sync and share your recordings online.
                    </p>
                    <div className="space-y-3 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Your recordings are uploaded to your YouTube channel</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span>One-click recording with instant shareable links</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Download className="h-4 w-4 text-purple-500" />
                        <span>Automatic sync and resumable uploads</span>
                      </div>
                    </div>
                    <Button 
                      onClick={connectYouTube}
                      disabled={isConnecting}
                      size="sm"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect YouTube'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        {state.recordings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Your Recordings</h2>
              <div className="text-sm text-muted-foreground">
                {state.recordings.filter(r => r.uploadStatus === 'local').length} local, {' '}
                {state.recordings.filter(r => r.uploadStatus === 'completed').length} synced
              </div>
            </div>
            {isConnecting ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <RecordingSkeleton count={8} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {state.recordings.map((recording) => (
                  <RecordingCard 
                    key={recording.id} 
                    recording={recording} 
                    onClick={() => handleRecordingClick(recording)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Getting Started Tips */}
        {state.recordings.length === 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6 text-center">
              <Play className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Ready to Record!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click the red record button in the top-right corner to start your first recording. 
                You can record immediately without connecting YouTube.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Your recordings will be saved locally. Connect YouTube anytime to sync them online.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Modal */}
      {selectedRecording && (
        <VideoModal 
          recording={selectedRecording} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
}

// Export with error boundary and performance monitoring
export default withErrorBoundary(
  withPerformanceMonitoring(MainPanelComponent, 'MainPanel'),
  {
    fallback: (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Main Panel</h2>
          <p className="text-muted-foreground">Please refresh the page to try again.</p>
        </div>
      </div>
    )
  }
);
