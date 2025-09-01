import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Circle, 
  ChevronUp, 
  Monitor, 
  Camera, 
  MonitorSpeaker,
  MousePointer,
  Pen
} from 'lucide-react';
import { useRecording, RecordingMode, RecordingOptions } from '../../contexts/RecordingContext';
import { useApp } from '../../contexts/AppContext';
import { useDrive } from '../../contexts/DriveContext';
import { useToast } from '@/components/ui/use-toast';

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions } = useRecording();
  const { state } = useApp();
  const { isConnected } = useDrive();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleModeSelect = async (mode: RecordingMode) => {
    if (!isConnected) {
      toast({
        title: "Drive Not Connected",
        description: "Please connect Google Drive before recording",
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

  const toggleClickHighlight = () => {
    updateOptions({ highlightClicks: !options.highlightClicks });
  };

  const toggleDrawing = () => {
    updateOptions({ enableDrawing: !options.enableDrawing });
  };

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

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className="floating-record-button h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all group relative"
          >
            <Circle className="h-6 w-6 fill-current" />
            
            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                Record
                <ChevronUp className="absolute top-full left-1/2 transform -translate-x-1/2 h-2 w-2 text-popover fill-current" />
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="top" 
          align="start" 
          className="w-64 mb-4"
          sideOffset={8}
        >
          {/* Recording Modes */}
          <DropdownMenuItem onClick={() => handleModeSelect('screen')}>
            <Monitor className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Screen Only</div>
              <div className="text-xs text-muted-foreground">Capture your screen</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleModeSelect('camera')}>
            <Camera className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Camera Only</div>
              <div className="text-xs text-muted-foreground">Record with webcam</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleModeSelect('screen-camera')}>
            <MonitorSpeaker className="h-4 w-4 mr-3" />
            <div className="flex-1">
              <div className="font-medium">Screen + Camera</div>
              <div className="text-xs text-muted-foreground">Screen with PiP camera</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Options */}
          <DropdownMenuItem onClick={toggleClickHighlight}>
            <MousePointer className="h-4 w-4 mr-3" />
            <div className="flex-1 flex items-center justify-between">
              <span>Highlight Clicks</span>
              {options.highlightClicks && (
                <Badge variant="secondary" className="text-xs">On</Badge>
              )}
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={toggleDrawing}>
            <Pen className="h-4 w-4 mr-3" />
            <div className="flex-1 flex items-center justify-between">
              <span>Drawing Tools</span>
              {options.enableDrawing && (
                <Badge variant="secondary" className="text-xs">On</Badge>
              )}
            </div>
          </DropdownMenuItem>

          {!isConnected && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs text-muted-foreground">
                Connect Google Drive to start recording
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
