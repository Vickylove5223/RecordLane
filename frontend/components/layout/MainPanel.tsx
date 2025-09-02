import React, { memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickActionsSkeleton, RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, Monitor, Camera, Zap, Shield, Download, Folder, AlertTriangle } from 'lucide-react';
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
    </CardContent>
  </Card>
));

RecordingCard.displayName = 'RecordingCard';

function MainPanelComponent() {
  const { isConnected, isConnecting, connectionError, retryConnection } = useYouTube();
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
    if (!isConnected) {
      // Show connection prompt
      return;
    }
    
    console.log(`Quick action: ${action}`);
    // Implement quick action logic
  };

  if (!isConnected || !state.isOnboarded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Video className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Welcome to RecordLane</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Record your screen and camera with instant YouTube sync
          </p>

          <div className="mb-6">
            <ConnectionStatus 
              status={getConnectionStatus()}
              text={getConnectionText()}
              className="mx-auto"
            />
          </div>

          {connectionError && (
            <Card className="text-left mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Connection Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      {connectionError}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={retryConnection}
                      disabled={isConnecting}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                    >
                      {isConnecting ? 'Retrying...' : 'Retry Connection'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isConnected && !connectionError && (
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Connect YouTube to get started</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
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
                disabled={!isConnected}
              />
              <QuickActionCard
                icon={Camera}
                title="Camera Recording"
                description="Record with your webcam for personal messages"
                color="text-green-500"
                onClick={() => handleQuickAction('camera')}
                disabled={!isConnected}
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
                disabled={!isConnected}
              />
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {state.recordings.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Recent Recordings</h2>
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
