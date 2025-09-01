import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Folder, Video, Clock, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useDrive } from '../../contexts/DriveContext';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar() {
  const { state } = useApp();
  const { folderName, isConnected } = useDrive();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-80 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recordings</h2>
          {isConnected && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span className="truncate max-w-32">{folderName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recordings List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {state.recordings.length === 0 ? (
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
                    <span>{formatDistanceToNow(recording.createdAt, { addSuffix: true })}</span>
                  </div>

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

                    {recording.driveLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(recording.driveLink, '_blank');
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
