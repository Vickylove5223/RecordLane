import React, { memo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ModernCard, DocumentCard, LayeredCardStack, GridCard } from '@/components/ui/modern-card';
import { RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, AlertTriangle, Play, ExternalLink, Clock, FileVideo, Upload, Share2, RefreshCw } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { useRecording } from '../../contexts/RecordingContext';
import { withErrorBoundary } from '../ErrorBoundary';
import { withPerformanceMonitoring } from '../../utils/performanceMonitor';
import { formatDistanceToNow } from 'date-fns';
import VideoModal from './VideoModal';
import RecordingPanel from '../recording/RecordingPanel';

const RecordingCard = memo(({ recording, onClick }: { recording: any; onClick: () => void }) => (
  <ModernCard variant="layered" className="p-6" onClick={onClick}>
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
      {recording.thumbnail ? (
        <img
          src={recording.thumbnail}
          alt={recording.title}
          className="w-full h-full object-cover rounded-lg"
          loading="lazy"
        />
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <Video className="h-8 w-8 text-gray-400" />
          <span className="text-xs text-gray-500">No Preview</span>
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-100 transition-opacity duration-200">
          <Play className="h-6 w-6 text-gray-800 ml-1" />
        </div>
      </div>
    </div>
    
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 truncate text-lg">{recording.title}</h3>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(recording.duration)}</span>
        </div>
        <span className="text-xs">{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {recording.uploadStatus === 'completed' && recording.youtubeLink && (
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Upload className="h-3 w-3 mr-1" />
              <span>Synced</span>
            </div>
          )}
        </div>
        {recording.youtubeLink && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              window.open(recording.youtubeLink, '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  </ModernCard>
));

RecordingCard.displayName = 'RecordingCard';

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function MainPanelComponent() {
  const { isConnected, isConnecting, connectionError } = useYouTube();
  const { state, refreshRecordings } = useApp();
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
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Recording Panel - Always at the top when recording */}
      {(recordingState === 'recording' || recordingState === 'paused') && (
        <div className="fixed top-16 sm:top-20 left-2 sm:left-4 lg:left-8 z-50">
          <RecordingPanel />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 mt-16 sm:mt-20">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent px-4">
            Welcome to RecordLane.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Record, share, and store videos without paying forever. An open-source Loom alternative that's totally free. Forget storage limits, hidden costs, and privacy risks.
          </p>

          {/* Connection Status */}
          <div className="mb-8">
            <ConnectionStatus 
              status={getConnectionStatus()}
              text={getConnectionText()}
              className="mx-auto"
            />
          </div>

        </div>

        {/* Recent Activity - Only show synced recordings */}
        {(() => {
          const syncedRecordings = state.recordings.filter(recording => 
            recording.uploadStatus === 'completed' && recording.youtubeLink
          );
          return syncedRecordings.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold">Your Synced Recordings</h2>
                <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
                  <div className="text-sm text-muted-foreground">
                    {syncedRecordings.length} recording{syncedRecordings.length !== 1 ? 's' : ''}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshRecordings}
                    disabled={state.isLoading}
                    className="h-8 text-xs sm:text-sm"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">↻</span>
                  </Button>
                </div>
              </div>
              {isConnecting ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  <RecordingSkeleton count={8} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {syncedRecordings.map((recording) => (
                    <RecordingCard 
                      key={recording.id} 
                      recording={recording} 
                      onClick={() => handleRecordingClick(recording)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Footer Section */}
        <div className="mt-16 sm:mt-20 mb-8 sm:mb-12">
          <div className="text-center">
            <div className="max-w-2xl mx-auto px-4">
              <p className="text-sm text-gray-500 mb-4">
                Built with ❤️ for creators who value privacy and freedom
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-gray-400">
                <span>Open Source</span>
                <span>•</span>
                <span>Privacy First</span>
                <span>•</span>
                <span>Free Forever</span>
                <span>•</span>
                <span>No Data Collection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        {(() => {
          const syncedRecordings = state.recordings.filter(recording => 
            recording.uploadStatus === 'completed' && recording.youtubeLink
          );
          return syncedRecordings.length === 0 && (
            <div className="max-w-4xl mx-auto px-4">
              <GridCard className="text-center p-6 sm:p-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Record!</h3>
                <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
                  Click the red record button in the top-right corner to start your first recording. 
                  Connect to YouTube to sync your recordings and see them here.
                </p>
                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-800 font-medium">
                    <strong>Tip:</strong> Only synced recordings appear here. Connect to YouTube to upload and view your recordings.
                  </span>
                </div>
              </GridCard>
            </div>
          );
        })()}
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
