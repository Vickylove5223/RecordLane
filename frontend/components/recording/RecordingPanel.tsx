import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Square, 
  Pause, 
  Play, 
  MousePointer, 
  Pen, 
  Move
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
    <div
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col items-center space-y-2 p-2"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div className="text-gray-400 cursor-grab">
        <Move className="h-4 w-4" />
      </div>

      {/* Pause/Resume Button */}
      {state === 'recording' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={pauseRecording}
          className="h-10 w-10 p-0 rounded-full"
          title="Pause Recording"
        >
          <Pause className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={resumeRecording}
          className="h-10 w-10 p-0 rounded-full"
          title="Resume Recording"
        >
          <Play className="h-5 w-5" />
        </Button>
      )}

      {/* Stop Button */}
      <Button
        size="sm"
        onClick={stopRecording}
        className="h-10 w-10 p-0 rounded-full bg-red-500 hover:bg-red-600"
        title="Stop Recording"
      >
        <Square className="h-5 w-5 text-white" />
      </Button>

      {/* Drawing Mode Toggle */}
      <Button
        size="sm"
        variant={isDrawingMode ? "default" : "outline"}
        onClick={toggleDrawingMode}
        className="h-10 w-10 p-0 rounded-full"
        title={isDrawingMode ? "Disable Drawing" : "Enable Drawing"}
      >
        <Pen className={`h-5 w-5 ${isDrawingMode ? 'text-white' : 'text-gray-600'}`} />
      </Button>

      {/* Click Highlights Toggle */}
      <Button
        size="sm"
        variant={highlightClicks ? "default" : "outline"}
        onClick={toggleClickHighlights}
        className="h-10 w-10 p-0 rounded-full"
        title={highlightClicks ? "Disable Click Highlights" : "Enable Click Highlights"}
      >
        <MousePointer className={`h-5 w-5 ${highlightClicks ? 'text-white' : 'text-gray-600'}`} />
      </Button>
    </div>
  );
}
