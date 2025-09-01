import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pause, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Camera,
  Mic,
  MicOff,
  Move
} from 'lucide-react';
import { useRecording } from '../../contexts/RecordingContext';

export default function RecordingOverlay() {
  const { 
    state, 
    duration, 
    pauseRecording, 
    resumeRecording, 
    stopRecording, 
    deleteRecording, 
    restartRecording 
  } = useRecording();
  
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragStart.y)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-4 min-w-80 draggable"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between space-x-4">
        {/* Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 recording-pulse' : 'bg-yellow-500'}`} />
            <Badge variant={state === 'recording' ? 'destructive' : 'secondary'}>
              {state === 'recording' ? 'REC' : 'PAUSED'}
            </Badge>
          </div>
          <span className="font-mono text-sm font-medium">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Pause/Resume */}
          {state === 'recording' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={pauseRecording}
              className="h-8 w-8 p-0"
            >
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={resumeRecording}
              className="h-8 w-8 p-0"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          {/* Stop */}
          <Button
            size="sm"
            onClick={stopRecording}
            className="h-8 px-3"
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>

          {/* Restart */}
          <Button
            size="sm"
            variant="outline"
            onClick={restartRecording}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="outline"
            onClick={deleteRecording}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Additional Controls */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center space-x-2">
          {/* Camera Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCameraVisible(!isCameraVisible)}
            className="h-8 w-8 p-0"
          >
            <Camera className={`h-4 w-4 ${isCameraVisible ? 'text-green-500' : 'text-muted-foreground'}`} />
          </Button>

          {/* Mic Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMicMuted(!isMicMuted)}
            className="h-8 w-8 p-0"
          >
            {isMicMuted ? (
              <MicOff className="h-4 w-4 text-red-500" />
            ) : (
              <Mic className="h-4 w-4 text-green-500" />
            )}
          </Button>
        </div>

        {/* Drag Handle */}
        <div className="text-muted-foreground">
          <Move className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
