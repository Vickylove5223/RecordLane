import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  MicOff,
  AlertTriangle,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useRecording, RecordingMode, RecordingOptions } from '../../contexts/RecordingContext';
import { RecordingService } from '../../services/recordingService';
import { useToast } from '@/components/ui/use-toast';

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions, state: recordingState } = useRecording();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<{
    camera: boolean;
    microphone: boolean;
    screenCapture: boolean;
    checking: boolean;
  }>({
    camera: false,
    microphone: false,
    screenCapture: false,
    checking: false,
  });
  const { toast } = useToast();

  // Check permissions when menu opens or options change
  useEffect(() => {
    if (isMenuOpen) {
      checkPermissions();
    }
  }, [isMenuOpen, options.mode, options.microphone]);

  const checkPermissions = async () => {
    setPermissionStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const permissions = await RecordingService.checkPermissions(options.mode, options.microphone);
      setPermissionStatus({
        ...permissions,
        checking: false,
      });
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionStatus({
        camera: false,
        microphone: false,
        screenCapture: false,
        checking: false,
      });
    }
  };

  const handleModeSelect = async (mode: RecordingMode) => {
    setIsMenuOpen(false);
    
    try {
      // The context now handles detailed error toasts.
      // We just call startRecording and the context will manage state and feedback.
      await startRecording({ ...options, mode });
    } catch (error) {
      // The error is already handled and toasted by the context.
      // We can add component-specific logic here if needed, but for now, just log it for debugging.
      console.log(`Recording start failed at component level for mode: ${mode}`, error);
    }
  };

  const getPermissionIcon = (hasPermission: boolean, checking: boolean) => {
    if (checking) return <LoadingSpinner size="sm" />;
    return hasPermission ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />;
  };

  const getPermissionText = (hasPermission: boolean, checking: boolean) => {
    if (checking) return "Checking...";
    return hasPermission ? "Allowed" : "Denied";
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
          className="w-80 mb-4"
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
            <div className="flex items-center ml-2">
              {getPermissionIcon(permissionStatus.screenCapture, permissionStatus.checking)}
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
            <div className="flex items-center ml-2">
              {getPermissionIcon(permissionStatus.camera, permissionStatus.checking)}
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
            <div className="flex items-center ml-2">
              {getPermissionIcon(permissionStatus.camera && permissionStatus.screenCapture, permissionStatus.checking)}
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
                <div className="flex items-center">
                  <span>Microphone</span>
                  {options.microphone && (
                    <div className="ml-2">
                      {getPermissionIcon(permissionStatus.microphone, permissionStatus.checking)}
                    </div>
                  )}
                </div>
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

          {/* Permission Status Summary */}
          <div className="px-2 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Browser Security:</span>
              <div className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                <span className={window.isSecureContext ? "text-green-600" : "text-red-600"}>
                  {window.isSecureContext ? "Secure" : "Insecure"}
                </span>
              </div>
            </div>
            {!window.isSecureContext && (
              <p className="text-xs text-red-600 mt-1">
                HTTPS required for recording
              </p>
            )}
          </div>
          
          <div className="px-2 py-2 text-xs text-muted-foreground border-t border-border">
            Recording works offline. Connect YouTube to sync.
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
