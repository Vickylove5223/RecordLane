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
  ChevronDown, 
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
  CheckCircle,
  Settings
} from 'lucide-react';
import { useRecording, RecordingMode, RecordingOptions } from '../../contexts/RecordingContext';
import { RecordingService } from '../../services/recordingService';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions, state: recordingState, permissionStatus } = useRecording();
  const { dispatch } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleModeSelect = async (mode: RecordingMode) => {
    setIsMenuOpen(false);
    
    try {
      // Update options and start recording
      const updatedOptions = { ...options, mode };
      updateOptions({ mode });
      await startRecording(updatedOptions);
    } catch (error) {
      // Error is already handled and toasted by the context
      console.log(`Recording start failed at component level for mode: ${mode}`, error);
    }
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(false);
    dispatch({ type: 'SET_SETTINGS_OPEN', payload: true });
  };

  const getPermissionIcon = (hasPermission: boolean, checking: boolean) => {
    if (checking) return <LoadingSpinner size="sm" />;
    return hasPermission ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />;
  };

  const getModePermissionStatus = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen':
        return permissionStatus.screen === 'granted' || permissionStatus.screen === 'prompt';
      case 'camera':
        return permissionStatus.camera === 'granted';
      case 'screen-camera':
        return (permissionStatus.screen === 'granted' || permissionStatus.screen === 'prompt') && 
               permissionStatus.camera === 'granted';
      default:
        return false;
    }
  };

  const getPermissionStatusText = (mode: RecordingMode) => {
    const hasPermission = getModePermissionStatus(mode);
    
    if (mode === 'screen' && permissionStatus.screen === 'prompt') {
      return 'Available';
    }
    
    return hasPermission ? 'Ready' : 'Need Permission';
  };

  const isStarting = recordingState === 'starting';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          disabled={isStarting}
          className="h-10 px-4 bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all group relative"
        >
          {isStarting ? (
            <LoadingSpinner size="sm" className="text-white mr-2" />
          ) : (
            <Circle className="h-4 w-4 fill-current mr-2" />
          )}
          <span className="hidden sm:inline">
            {isStarting ? 'Starting...' : 'Record'}
          </span>
          <ChevronDown className="h-3 w-3 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        side="bottom" 
        align="end" 
        className="w-80 mt-2"
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
            <span className="text-xs text-muted-foreground mr-1">
              {getPermissionStatusText('screen')}
            </span>
            {getPermissionIcon(getModePermissionStatus('screen'), permissionStatus.screen === 'checking')}
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
            <span className="text-xs text-muted-foreground mr-1">
              {getPermissionStatusText('camera')}
            </span>
            {getPermissionIcon(getModePermissionStatus('camera'), permissionStatus.camera === 'checking')}
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
            <span className="text-xs text-muted-foreground mr-1">
              {getPermissionStatusText('screen-camera')}
            </span>
            {getPermissionIcon(getModePermissionStatus('screen-camera'), 
              permissionStatus.camera === 'checking' || permissionStatus.screen === 'checking')}
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
                    {getPermissionIcon(permissionStatus.microphone === 'granted', permissionStatus.microphone === 'checking')}
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

        {/* Settings */}
        <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-3" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Security Status */}
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
  );
}
