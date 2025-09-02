import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RecordingSkeleton } from '@/components/ui/loading-skeleton';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { ConnectionStatus } from '@/components/ui/connection-status';
import { Video, Clock, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar() {
  const { state } = useApp();
  const { isConnected, isConnecting } = useYouTube();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getConnectionStatus = () => {
    if (isConnecting) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  };

  const getConnectionText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected to YouTube';
    return 'Not connected';
  };

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recordings</h2>
        </div>
        
        {/* Connection Status */}
        <ConnectionStatus 
          status={getConnectionStatus()}
          text={getConnectionText()}
        />
      </div>

      {/* Recordings List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isConnecting ? (
            <RecordingSkeleton count={3} />
          ) : state.recordings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No recordings yet</p>
              <p className="text-xs mt-1">Click the record button to get started</p>
            </div>
          ) : (
            state.recordings.map((recording) => (
              <div
                key={recording.id}
                className="group p-3 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                {/* Thumbnail */}
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

                {/* Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm truncate" title={recording.title}>
                    {recording.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(recording.duration)}</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(recording.createdAt), { addSuffix: true })}</span>
                  </div>

                  {/* Upload Progress */}
                  {recording.uploadStatus === 'uploading' && (
                    <ProgressIndicator
                      progress={recording.uploadProgress || 0}
                      status={recording.uploadStatus}
                      className="mt-2"
                    />
                  )}

                  {/* Status & Actions */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        recording.uploadStatus === 'completed'
                          ? 'default'
                          : recording.uploadStatus === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {recording.uploadStatus === 'completed' && 'Synced'}
                      {recording.uploadStatus === 'uploading' && `${recording.uploadProgress || 0}%`}
                      {recording.uploadStatus === 'pending' && 'Pending'}
                      {recording.uploadStatus === 'failed' && 'Failed'}
                    </Badge>

                    {recording.youtubeLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(recording.youtubeLink, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
