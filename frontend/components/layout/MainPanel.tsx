import React, { memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickActionsSkeleton, RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, Monitor, Camera, Zap, Shield, Download, Folder, AlertTriangle, Wifi, Play } from 'lucide-react';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useApp } from '../../contexts/AppContext';
import { withErrorBoundary } from '../ErrorBoundary';
import { withPerformanceMonitoring } from '../../utils/performanceMonitor';

const QuickActionCard = memo(({ icon: Icon, title, description, color, onClick, disabled }: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}) => (
  <Card 
    className={`hover:shadow-lg transition-shadow ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    onClick={disabled ? undefined : onClick}
  >
    <CardContent className="p-6 text-center">
      <Icon className={`h-12 w-12 ${color} mx-auto mb-4`} />
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
));

QuickActionCard.displayName = 'QuickActionCard';

const RecordingCard = memo(({ recording }: { recording: any }) => (
  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
      <p className="text-sm text-muted-foreground">
        {new Date(recording.createdAt).toLocaleDateString()}
      </p>
      {recording.uploadStatus === 'local' && (
        <div className="flex items-center text-xs text-blue-600 mt-1">
          <Download className="h-3 w-3 mr-1" />
          <span>Local</span>
        </div>
      )}
    </CardContent>
  </Card>
));

RecordingCard.displayName = 'RecordingCard';

function MainPanelComponent() {
  const { isConnected, isConnecting, connectionError, retryConnection, connectYouTube } = useYouTube();
  const { state } = useApp();

  useEffect(() => {
    // Check for connection issues and auto-retry
    if (connectionError && !isConnecting) {
      const retryTimer = setTimeout(() => {
        console.log('Auto-retrying connection...');
        retryConnection();
      }, 5000); // Retry after 5 seconds

      return () => clearTimeout(retryTimer);
    }
  }, [connectionError, isConnecting, retryConnection]);

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

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // Quick actions now work without YouTube connection
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Video className="h-16 w-16 text-primary" />
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Quick Start</h2>
          {isConnecting ? (
            <QuickActionsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickActionCard
                icon={Monitor}
                title="Screen Recording"
                description="Capture your entire screen or specific windows"
                color="text-blue-500"
                onClick={() => handleQuickAction('screen')}
              />
              <QuickActionCard
                icon={Camera}
                title="Camera Recording"
                description="Record with your webcam for personal messages"
                color="text-green-500"
                onClick={() => handleQuickAction('camera')}
              />
              <QuickActionCard
                icon={() => (
                  <div className="relative">
                    <Monitor className="h-12 w-12 text-purple-500" />
                    <Camera className="h-6 w-6 text-purple-500 absolute -bottom-1 -right-1 bg-background rounded" />
                  </div>
                )}
                title="Screen + Camera"
                description="Combine screen capture with picture-in-picture camera"
                color=""
                onClick={() => handleQuickAction('screen-camera')}
              />
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {state.recordings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Recent Recordings</h2>
              <div className="text-sm text-muted-foreground">
                {state.recordings.filter(r => r.uploadStatus === 'local').length} local, {' '}
                {state.recordings.filter(r => r.uploadStatus === 'completed').length} synced
              </div>
            </div>
            {isConnecting ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <RecordingSkeleton count={6} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.recordings.slice(0, 6).map((recording) => (
                  <RecordingCard key={recording.id} recording={recording} />
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
                Click the red record button in the bottom-left corner to start your first recording. 
                You can record immediately without connecting YouTube.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Tip:</strong> Your recordings will be saved locally. Connect YouTube anytime to sync them online.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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
