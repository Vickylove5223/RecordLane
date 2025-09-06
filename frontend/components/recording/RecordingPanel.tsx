import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Square, 
  Pause, 
  Play, 
  MousePointer, 
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
  
  const [position, setPosition] = useState({ x: 20, y: 80 }); // Adjusted initial y position
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { highlightClicks } = options;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const toggleClickHighlights = () => {
    updateOptions({ highlightClicks: !highlightClicks });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragStart.x)), // 60 is approx width of panel
          y: Math.max(0, Math.min(window.innerHeight - 280, e.clientY - dragStart.y)), // 280 is approx height
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Don't render if not recording or paused
  if (state !== 'recording' && state !== 'paused') {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white rounded-full shadow-lg border border-gray-200 flex flex-col items-center space-y-1 sm:space-y-2 p-1 sm:p-2"
      style={{ 
        left: position.x, 
        top: position.y,
      }}
    >
      {/* Drag Handle */}
      <div 
        className="text-gray-400 cursor-grab p-2"
        onMouseDown={handleMouseDown}
      >
        <Move className="h-4 w-4" />
      </div>

      {/* Pause/Resume Button */}
      {state === 'recording' ? (
        <Button
          size="sm"
          variant="outline"
          onClick={pauseRecording}
          className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full"
          title="Pause Recording"
        >
          <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={resumeRecording}
          className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full"
          title="Resume Recording"
        >
          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      )}

      {/* Stop Button */}
      <Button
        size="sm"
        onClick={stopRecording}
        className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full bg-red-500 hover:bg-red-600"
        title="Stop Recording"
      >
        <Square className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </Button>

      {/* Cursor Highlighting Toggle */}
      <Button
        size="sm"
        variant={highlightClicks ? "default" : "outline"}
        onClick={toggleClickHighlights}
        className="h-8 w-8 sm:h-10 sm:w-10 p-0 rounded-full"
        title={highlightClicks ? "Stop Cursor Highlighting" : "Start Cursor Highlighting"}
      >
        <MousePointer className={`h-4 w-4 sm:h-5 sm:w-5 ${highlightClicks ? 'text-white' : 'text-gray-600'}`} />
      </Button>
    </div>
  );
}
