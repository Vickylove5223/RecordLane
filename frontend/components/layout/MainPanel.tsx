import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuickActionsSkeleton, RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, Monitor, Camera, Zap, Shield, Download } from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useApp } from '../../contexts/AppContext';

export default function MainPanel() {
  const { isConnected, isConnecting } = useDrive();
  const { state } = useApp();

  const getConnectionStatus = () => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  if (!isConnected || !state.isOnboarded) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Video className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Welcome to LoomClone</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Record your screen and camera with instant Google Drive sync
          </p>

          <div className="mb-6">
            <ConnectionStatus 
              status={getConnectionStatus()}
              className="mx-auto"
            />
          </div>

          {!isConnected && (
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Connect Google Drive to get started</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Your recordings are stored only in your Google Drive</span>
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
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Monitor className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Screen Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Capture your entire screen or specific windows
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Camera className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Camera Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Record with your webcam for personal messages
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="relative mx-auto mb-4">
                    <Monitor className="h-12 w-12 text-purple-500" />
                    <Camera className="h-6 w-6 text-purple-500 absolute -bottom-1 -right-1 bg-background rounded" />
                  </div>
                  <h3 className="font-semibold mb-2">Screen + Camera</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine screen capture with picture-in-picture camera
                  </p>
                </CardContent>
              </Card>
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
                  <Card key={recording.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-3 flex items-center justify-center">
                        {recording.thumbnail ? (
                          <img
                            src={recording.thumbnail}
                            alt={recording.title}
                            className="w-full h-full object-cover rounded"
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
