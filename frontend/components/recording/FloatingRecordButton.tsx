import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions, state: recordingState } = useRecording();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleModeSelect = async (mode: RecordingMode) => {
    setIsMenuOpen(false);
    // The context already has the latest options, just override the mode
    await startRecording({ ...options, mode });
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
            
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
                {isStarting ? 'Starting...' : 'Record'}
                <ChevronUp className="absolute top-full left-1/2 transform -translate-x-1/2 h-2 w-2 text-popover fill-current" />
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          side="top" 
          align="start" 
          className="w-72 mb-4"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
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

          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Audio</p>
          </div>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
            <div className="flex items-center w-full">
              {options.systemAudio ? <Volume2 className="h-4 w-4 mr-3" /> : <VolumeX className="h-4 w-4 mr-3" />}
              <div className="flex-1 flex items-center justify-between">
                <span>System Audio</span>
                <Switch
                  checked={options.systemAudio}
                  onCheckedChange={(checked) => updateOptions({ systemAudio: checked })}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
            <div className="flex items-center w-full">
              {options.microphone ? <Mic className="h-4 w-4 mr-3" /> : <MicOff className="h-4 w-4 mr-3" />}
              <div className="flex-1 flex items-center justify-between">
                <span>Microphone</span>
                <Switch
                  checked={options.microphone}
                  onCheckedChange={(checked) => updateOptions({ microphone: checked })}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="px-2 py-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Visual Effects</p>
          </div>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
            <div className="flex items-center w-full">
              <MousePointer className="h-4 w-4 mr-3" />
              <div className="flex-1 flex items-center justify-between">
                <span>Highlight Clicks</span>
                <Switch
                  checked={options.highlightClicks}
                  onCheckedChange={(checked) => updateOptions({ highlightClicks: checked })}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-transparent cursor-default">
            <div className="flex items-center w-full">
              <Pen className="h-4 w-4 mr-3" />
              <div className="flex-1 flex items-center justify-between">
                <span>Drawing Tools</span>
                <Switch
                  checked={options.enableDrawing}
                  onCheckedChange={(checked) => updateOptions({ enableDrawing: checked })}
                />
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Recording works offline. Connect YouTube to sync.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
