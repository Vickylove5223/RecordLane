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
  Volume2,
  Mic,
  VolumeX,
  MicOff,
  AlertTriangle,
  Shield,
  CheckCircle,
  Settings,
  Play
} from 'lucide-react';
import { useRecording, RecordingMode, RecordingOptions } from '../../contexts/RecordingContext';
import { RecordingService } from '../../services/recordingService';
import { useApp } from '../../contexts/AppContext';
import { useToast } from '@/components/ui/use-toast';

export default function FloatingRecordButton() {
  const { startRecording, options, updateOptions, state: recordingState, permissionStatus } = useRecording();
  const { dispatch } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<RecordingMode>('screen');
  const [localOptions, setLocalOptions] = useState(options);
  const { toast } = useToast();

  // Update local options when context options change
  useEffect(() => {
    setLocalOptions(options);
    setSelectedMode(options.mode);
  }, [options]);

  const handleModeSelect = (mode: RecordingMode) => {
    setSelectedMode(mode);
    setLocalOptions(prev => ({ ...prev, mode }));
  };

  const handleOptionChange = (key: keyof RecordingOptions, value: any) => {
    setLocalOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleStartRecording = async () => {
    try {
      // Update global options
      updateOptions(localOptions);
      
      // Start recording with selected options
      await startRecording(localOptions);
      
      // Close menu after successful start
      setIsMenuOpen(false);
    } catch (error) {
      console.log(`Recording start failed at component level for mode: ${localOptions.mode}`, error);
      // Error is already handled and toasted by the context
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

  const getModeIcon = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen': return Monitor;
      case 'camera': return Camera;
      case 'screen-camera': return MonitorSpeaker;
    }
  };

  const getModeLabel = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen': return 'Screen Only';
      case 'camera': return 'Camera Only';
      case 'screen-camera': return 'Screen + Camera';
    }
  };

  const getModeDescription = (mode: RecordingMode) => {
    switch (mode) {
      case 'screen': return 'Capture your screen';
      case 'camera': return 'Record with webcam';
      case 'screen-camera': return 'Screen with PiP camera';
    }
  };

  const isStarting = recordingState === 'starting';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          disabled={isStarting}
          className="h-10 px-4 bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all group relative"
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
        className="w-80 mt-2 p-0"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 space-y-4">
          {/* Recording Mode Selection */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Recording Mode</p>
            <div className="space-y-2">
              {(['screen', 'camera', 'screen-camera'] as RecordingMode[]).map((mode) => {
                const Icon = getModeIcon(mode);
                const isSelected = selectedMode === mode;
                const hasPermission = getModePermissionStatus(mode);
                const statusText = getPermissionStatusText(mode);
                const isChecking = mode === 'camera' ? permissionStatus.camera === 'checking' :
                                 mode === 'screen' ? permissionStatus.screen === 'checking' :
                                 permissionStatus.camera === 'checking' || permissionStatus.screen === 'checking';

                return (
                  <div
                    key={mode}
                    onClick={() => handleModeSelect(mode)}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent/50
                      ${isSelected ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <div>
                          <div className={`font-medium text-sm ${isSelected ? 'text-red-700 dark:text-red-300' : 'text-foreground'}`}>
                            {getModeLabel(mode)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getModeDescription(mode)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center ml-2">
                        <span className="text-xs text-muted-foreground mr-1">
                          {statusText}
                        </span>
                        {getPermissionIcon(hasPermission, isChecking)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Audio Options */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Audio</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {localOptions.systemAudio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span className="text-sm">System Audio</span>
                </div>
                <Switch
                  checked={localOptions.systemAudio}
                  onCheckedChange={(checked) => handleOptionChange('systemAudio', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {localOptions.microphone ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Microphone</span>
                    {localOptions.microphone && (
                      <div>
                        {getPermissionIcon(permissionStatus.microphone === 'granted', permissionStatus.microphone === 'checking')}
                      </div>
                    )}
                  </div>
                </div>
                <Switch
                  checked={localOptions.microphone}
                  onCheckedChange={(checked) => handleOptionChange('microphone', checked)}
                />
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Start Recording Button */}
          <div className="pt-2">
            <Button
              onClick={handleStartRecording}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white"
              size="lg"
            >
              {isStarting ? (
                <LoadingSpinner text="Starting..." size="sm" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Settings Link */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSettingsClick}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>

            {/* Security Status */}
            <div className="flex items-center space-x-1 text-xs">
              <Shield className="h-3 w-3" />
              <span className={window.isSecureContext ? "text-green-600" : "text-red-600"}>
                {window.isSecureContext ? "Secure" : "Insecure"}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            Recording works offline. Connect YouTube to sync.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
