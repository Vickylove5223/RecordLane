import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/spinner';
import { 
  Circle, 
  ChevronUp, 
  Monitor, 
  Camera, 
  MonitorSpeaker,
  MousePointer,
  Pen,
  Volume2,
  Mic,
  VolumeX,
  MicOff
} from 'lucide-react';
import { useRecording, RecordingMode, RecordingOptions } from '../../contexts/RecordingContext';
import { useApp } from '../../contexts/AppContext';
import { useYouTube } from '../../contexts/YouTubeContext';
import { useToast } from '@/components/ui/use-toast';

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions, state: recordingState } = useRecording();
  const { state } = useApp();
  const { isConnected } = useYouTube();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleModeSelect = async (mode: RecordingMode) => {
    if (!isConnected) {
      toast({
        title: "YouTube Not Connected",
        description: "Please connect your YouTube account before recording",
        variant: "destructive",
      });
      return;
    }

    const recordingOptions: RecordingOptions = {
      ...options,
      mode,
    };

    updateOptions(recordingOptions);
    await startRecording(recordingOptions);
    setIsMenuOpen(false);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const toggleClickHighlight = (e: React.MouseEvent) => {
    handleToggleClick(e);
    updateOptions({ highlightClicks: !options.highlightClicks });
  };

  const toggleDrawing = (e: React.MouseEvent) => {
    handleToggleClick(e);
    updateOptions({ enableDrawing: !options.enableDrawing });
  };

  const toggleSystemAudio = (e: React.MouseEvent) => {
    handleToggleClick(e);
    updateOptions({ systemAudio: !options.systemAudio });
  };

  const toggleMicrophone = (e: React.MouseEvent) => {
    handleToggleClick(e);
    updateOptions({ microphone: !options.microphone });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const getModeIcon = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen':
        return <Monitor className="h-4 w-4" />;
      case 'camera':
        return <Camera className="h-4 w-4" />;
      case 'screen-camera':
        return <MonitorSpeaker className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getModeLabel = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen':
        return 'Screen Only';
      case 'camera':
        return 'Camera Only';
      case 'screen-camera':
        return 'Screen + Camera';
      default:
        return 'Screen Only';
    }
  };

  const isStarting = recordingState === 'starting';

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            disabled={isStarting}
            className="floating-record-button h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all group relative"
          >
            {isStarting ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <Circle className="h-6 w-6 fill-current" />
            )}
            
            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                {isStarting ? 'Starting...' : 'Record'}
                <ChevronUp className="absolute top-full left-1/2 transform -translate-x-1/2 h-2 w-2 text-popover fill-current" />
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          ref={menuRef}
          side="top" 
          align="start" 
          className="w-72 mb-4"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Recording Modes */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recording Mode</p>
          </div>
          
          <DropdownMenuItem 
            onClick={() => handleModeSelect('screen')}
            className="cursor-pointer"
          >
            <Monitor className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Screen Only</div>
              <div className="text-xs text-muted-foreground">Capture your screen</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleModeSelect('camera')}
            className="cursor-pointer"
          >
            <Camera className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Camera Only</div>
              <div className="text-xs text-muted-foreground">Record with webcam</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleModeSelect('screen-camera')}
            className="cursor-pointer"
          >
            <MonitorSpeaker className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Screen + Camera</div>
              <div className="text-xs text-muted-foreground">Screen with PiP camera</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Audio Options */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Audio</p>
          </div>

          <DropdownMenuItem 
            onClick={toggleSystemAudio}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              {options.systemAudio ? (
                <Volume2 className="h-4 w-4 mr-3" />
              ) : (
                <VolumeX className="h-4 w-4 mr-3" />
              )}
              <div className="flex-1 flex items-center justify-between">
                <span>System Audio</span>
                <Switch
                  checked={options.systemAudio}
                  onCheckedChange={toggleSystemAudio}
                  onClick={handleToggleClick}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={toggleMicrophone}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              {options.microphone ? (
                <Mic className="h-4 w-4 mr-3" />
              ) : (
                <MicOff className="h-4 w-4 mr-3" />
              )}
              <div className="flex-1 flex items-center justify-between">
                <span>Microphone</span>
                <Switch
                  checked={options.microphone}
                  onCheckedChange={toggleMicrophone}
                  onClick={handleToggleClick}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Visual Options */}
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Visual Effects</p>
          </div>

          <DropdownMenuItem 
            onClick={toggleClickHighlight}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              <MousePointer className="h-4 w-4 mr-3" />
              <div className="flex-1 flex items-center justify-between">
                <span>Highlight Clicks</span>
                <Switch
                  checked={options.highlightClicks}
                  onCheckedChange={toggleClickHighlight}
                  onClick={handleToggleClick}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={toggleDrawing}
            className="cursor-pointer"
          >
            <div className="flex items-center w-full">
              <Pen className="h-4 w-4 mr-3" />
              <div className="flex-1 flex items-center justify-between">
                <span>Drawing Tools</span>
                <Switch
                  checked={options.enableDrawing}
                  onCheckedChange={toggleDrawing}
                  onClick={handleToggleClick}
                />
              </div>
            </div>
          </DropdownMenuItem>

          {!isConnected && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Connect YouTube to start recording
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
