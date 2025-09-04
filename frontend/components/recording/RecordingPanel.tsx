import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Square, 
  Pause, 
  Play, 
  MousePointer, 
  Pen, 
  Move,
  RotateCcw,
  Trash2,
  Clock,
  Download
} from 'lucide-react';
import { useRecording } from '../../contexts/RecordingContext';

export default function RecordingPanel() {
  const { 
    state, 
    duration, 
    pauseRecording, 
    resumeRecording, 
    stopRecording, 
    deleteRecording, 
    restartRecording,
    options,
    updateOptions
  } = useRecording();
  
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [highlightClicks, setHighlightClicks] = useState(options.highlightClicks);

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

  const handleScreenshot = async () => {
    try {
      // Use the browser's built-in screenshot API if available
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { mediaSource: 'screen' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            
            // Convert to blob and download
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
            }, 'image/png');
          }
          
          // Stop the stream
          stream.getTracks().forEach(track => track.stop());
        });
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    updateOptions({ enableDrawing: !isDrawingMode });
  };

  const toggleClickHighlights = () => {
    const newValue = !highlightClicks;
    setHighlightClicks(newValue);
    updateOptions({ highlightClicks: newValue });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x)),
          y: Math.max(0, Math.min(window.innerHeight - 120, e.clientY - dragStart.y)),
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

  // Don't render if not recording or paused
  if (state !== 'recording' && state !== 'paused') {
    return null;
  }

  return (
    <Card
      className="fixed z-50 shadow-lg min-w-96 draggable border-2 border-red-500/50"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <CardContent className="p-4">
        {/* Status and Timer Row */}
        <div className="flex items-center justify-between space-x-4 mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 recording-pulse' : 'bg-yellow-500'}`} />
              <Badge variant={state === 'recording' ? 'destructive' : 'secondary'}>
                {state === 'recording' ? 'REC' : 'PAUSED'}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Drag Handle */}
          <div className="text-muted-foreground">
            <Move className="h-4 w-4" />
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex items-center justify-between space-x-2 mb-3">
          {/* Pause/Resume */}
          {state === 'recording' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={pauseRecording}
              className="h-8 px-3"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={resumeRecording}
              className="h-8 px-3"
            >
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}

          {/* Stop */}
          <Button
            size="sm"
            onClick={stopRecording}
            className="h-8 px-3 bg-red-500 hover:bg-red-600"
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

        {/* Visual Effects and Screenshot Row */}
        <div className="flex items-center justify-between space-x-2">
          {/* Screenshot */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleScreenshot}
            className="h-8 px-3"
            title="Take Screenshot"
          >
            <Camera className="h-4 w-4 mr-1" />
            Screenshot
          </Button>

          {/* Drawing Mode Toggle */}
          <Button
            size="sm"
            variant={isDrawingMode ? "default" : "outline"}
            onClick={toggleDrawingMode}
            className="h-8 w-8 p-0"
            title={isDrawingMode ? "Disable Drawing" : "Enable Drawing"}
          >
            <Pen className={`h-4 w-4 ${isDrawingMode ? 'text-white' : 'text-primary'}`} />
          </Button>

          {/* Click Highlights Toggle */}
          <Button
            size="sm"
            variant={highlightClicks ? "default" : "outline"}
            onClick={toggleClickHighlights}
            className="h-8 w-8 p-0"
            title={highlightClicks ? "Disable Click Highlights" : "Enable Click Highlights"}
          >
            <MousePointer className={`h-4 w-4 ${highlightClicks ? 'text-white' : 'text-primary'}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
