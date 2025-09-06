import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { RecordingService } from '../services/recordingService';
import { useToast } from '@/components/ui/use-toast';
import { useApp } from './AppContext';

export type RecordingMode = 'screen' | 'camera' | 'screen-camera';
export type RecordingState = 'idle' | 'starting' | 'recording' | 'paused' | 'stopped';

export interface RecordingOptions {
  mode: RecordingMode;
  highlightClicks: boolean;
  systemAudio: boolean;
  microphone: boolean;
  resolution: '480p' | '720p' | '1080p';
  frameRate: 30 | 60;
}

interface RecordingContextType {
  state: RecordingState;
  duration: number;
  recordedBlob: Blob | null;
  options: RecordingOptions;
  permissionStatus: {
    camera: 'granted' | 'denied' | 'prompt' | 'checking';
    microphone: 'granted' | 'denied' | 'prompt' | 'checking';
    screen: 'granted' | 'denied' | 'prompt' | 'checking';
  };
  
  startRecording: (options: RecordingOptions) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  deleteRecording: () => void;
  restartRecording: () => void;
  
  updateOptions: (options: Partial<RecordingOptions>) => void;
  getPreviewUrl: () => string | null;
  checkPermissions: () => Promise<void>;
  requestPermissions: (type: 'camera' | 'microphone' | 'screen') => Promise<boolean>;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'prompt' as const,
    microphone: 'prompt' as const,
    screen: 'prompt' as const,
  });

  const { state: appState } = useApp();

  const [options, setOptions] = useState<RecordingOptions>({
    mode: 'screen',
    highlightClicks: appState.settings.highlightClicksDefault,
    systemAudio: true,
    microphone: false,
    resolution: appState.settings.defaultResolution,
    frameRate: appState.settings.defaultFrameRate,
  });

  const recordingServiceRef = useRef<RecordingService | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setDuration(Date.now() - startTime);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const checkPermissions = useCallback(async () => {
    if (!navigator.mediaDevices) {
      console.warn('MediaDevices API not supported');
      return;
    }

    try {
      setPermissionStatus(prev => ({
        ...prev,
        camera: 'checking',
        microphone: 'checking',
        screen: 'checking',
      }));

      // Check camera permission
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionStatus(prev => ({ 
          ...prev, 
          camera: cameraPermission.state === 'granted' ? 'granted' : 
                   cameraPermission.state === 'denied' ? 'denied' : 'prompt'
        }));
      } catch (error) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          stream.getTracks().forEach(track => track.stop());
          setPermissionStatus(prev => ({ ...prev, camera: 'granted' }));
        } catch (cameraError) {
          setPermissionStatus(prev => ({ 
            ...prev, 
            camera: cameraError.name === 'NotAllowedError' ? 'denied' : 'prompt'
          }));
        }
      }

      // Check microphone permission
      try {
        const microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(prev => ({ 
          ...prev, 
          microphone: microphonePermission.state === 'granted' ? 'granted' : 
                      microphonePermission.state === 'denied' ? 'denied' : 'prompt'
        }));
      } catch (error) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          stream.getTracks().forEach(track => track.stop());
          setPermissionStatus(prev => ({ ...prev, microphone: 'granted' }));
        } catch (micError) {
          setPermissionStatus(prev => ({ 
            ...prev, 
            microphone: micError.name === 'NotAllowedError' ? 'denied' : 'prompt'
          }));
        }
      }

      // Screen capture permission cannot be pre-checked
      const hasScreenCapture = navigator.mediaDevices.getDisplayMedia !== undefined;
      setPermissionStatus(prev => ({ 
        ...prev, 
        screen: hasScreenCapture ? 'prompt' : 'denied' 
      }));

    } catch (error) {
      console.error('Failed to check permissions:', error);
      setPermissionStatus({
        camera: 'denied',
        microphone: 'denied',
        screen: 'denied',
      });
    }
  }, []);

  const requestPermissions = useCallback(async (type: 'camera' | 'microphone' | 'screen'): Promise<boolean> => {
    try {
      setPermissionStatus(prev => ({ ...prev, [type]: 'checking' }));

      let stream: MediaStream | null = null;
      
      switch (type) {
        case 'camera':
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          break;
        case 'microphone':
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          break;
        case 'screen':
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          break;
      }

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setPermissionStatus(prev => ({ ...prev, [type]: 'granted' }));
        
        toast({
          title: "Permission Granted",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} access granted successfully.`,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
      
      let status: 'denied' | 'prompt' = 'denied';
      let message = `${type.charAt(0).toUpperCase() + type.slice(1)} access was denied.`;
      
      if (error.name === 'NotAllowedError') {
        status = 'denied';
        message = `${type.charAt(0).toUpperCase() + type.slice(1)} permission was denied. Please allow access in your browser settings.`;
      } else if (error.name === 'NotFoundError') {
        message = `No ${type} device found. Please connect a ${type} and try again.`;
      } else if (error.name === 'NotReadableError') {
        message = `${type.charAt(0).toUpperCase() + type.slice(1)} is already in use by another application.`;
      } else if (error.name === 'AbortError' && type === 'screen') {
        message = 'Screen sharing was cancelled.';
        status = 'prompt';
      }

      setPermissionStatus(prev => ({ ...prev, [type]: status }));
      
      toast({
        title: "Permission Request Failed",
        description: message,
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  const startRecording = useCallback(async (recordingOptions: RecordingOptions) => {
    try {
      setState('starting');
      setDuration(0);
      setRecordedBlob(null);
      setOptions(recordingOptions);

      const needsCamera = recordingOptions.mode === 'camera' || recordingOptions.mode === 'screen-camera';
      const needsScreen = recordingOptions.mode === 'screen' || recordingOptions.mode === 'screen-camera';
      const needsMicrophone = recordingOptions.microphone;

      if (needsCamera && permissionStatus.camera !== 'granted') {
        const granted = await requestPermissions('camera');
        if (!granted) {
          setState('idle');
          return;
        }
      }

      if (needsMicrophone && permissionStatus.microphone !== 'granted') {
        const granted = await requestPermissions('microphone');
        if (!granted) {
          setState('idle');
          return;
        }
      }

      // Screen sharing permission is requested directly in RecordingService
      // No need to pre-request it here as it causes double modal

      recordingServiceRef.current = new RecordingService();
      
      // Set callback for when screen sharing is stopped by user
      recordingServiceRef.current.setScreenShareEndedCallback(() => {
        console.log('Screen sharing ended by user, stopping recording...');
        stopRecording();
      });
      
      await recordingServiceRef.current.startRecording(recordingOptions);
      
      setState('recording');
      startTimer();
      
      toast({
        title: "Recording Started",
        description: "Your recording has started successfully",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
      
      if (error.code === 'PERMISSIONS_DENIED') {
        toast({
          title: "Permissions Required",
          description: "Please allow camera and microphone access to start recording. You can grant permissions in your browser settings.",
          variant: "destructive",
        });
      } else if (error.code === 'BROWSER_NOT_SUPPORTED') {
        toast({
          title: "Browser Not Supported",
          description: "Please use Chrome, Edge, or Firefox for the best recording experience.",
          variant: "destructive",
        });
      } else if (error.code === 'SECURITY_ERROR') {
        toast({
          title: "Security Error",
          description: "Recording requires a secure connection (HTTPS). Please ensure you're using a secure connection.",
          variant: "destructive",
        });
      } else if (error.code === 'DEVICE_NOT_FOUND') {
        toast({
          title: "Device Not Found",
          description: "Camera or microphone not found. Please check your device connections.",
          variant: "destructive",
        });
      } else if (error.code === 'DEVICE_IN_USE') {
        toast({
          title: "Device Busy",
          description: "Your camera or microphone is being used by another application. Please close other apps and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Recording Failed",
          description: "Failed to start recording. Please check your permissions and try again.",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  }, [startTimer, toast, permissionStatus, requestPermissions]);

  const pauseRecording = useCallback(() => {
    if (recordingServiceRef.current && state === 'recording') {
      recordingServiceRef.current.pauseRecording();
      setState('paused');
      stopTimer();
      
      toast({
        title: "Recording Paused",
        description: "Recording has been paused",
      });
    }
  }, [state, stopTimer, toast]);

  const resumeRecording = useCallback(() => {
    if (recordingServiceRef.current && state === 'paused') {
      recordingServiceRef.current.resumeRecording();
      setState('recording');
      startTimer();
      
      toast({
        title: "Recording Resumed",
        description: "Recording has been resumed",
      });
    }
  }, [state, startTimer, toast]);

  const stopRecording = useCallback(async () => {
    if (recordingServiceRef.current && (state === 'recording' || state === 'paused')) {
      try {
        const blob = await recordingServiceRef.current.stopRecording();
        
        if (!blob || blob.size === 0) {
          throw new Error('Recording failed: No data recorded');
        }
        
        setRecordedBlob(blob);
        setState('stopped');
        stopTimer();
        
        toast({
          title: "Recording Stopped",
          description: `Recording saved successfully (${(blob.size / 1024 / 1024).toFixed(1)} MB)`,
        });
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setState('idle');
        toast({
          title: "Stop Failed",
          description: "Failed to save recording. Please try recording again.",
          variant: "destructive",
        });
      }
    }
  }, [state, stopTimer, toast]);

  const deleteRecording = useCallback(() => {
    if (recordingServiceRef.current) {
      recordingServiceRef.current.cleanup();
      recordingServiceRef.current = null;
    }
    
    if (recordedBlob) {
      try {
        URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    setRecordedBlob(null);
    setState('idle');
    setDuration(0);
    stopTimer();
  }, [recordedBlob, stopTimer]);

  const restartRecording = useCallback(async () => {
    deleteRecording();
    setTimeout(() => {
      startRecording(options);
    }, 100);
  }, [deleteRecording, startRecording, options]);

  const updateOptions = useCallback((newOptions: Partial<RecordingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const getPreviewUrl = useCallback(() => {
    if (!recordedBlob) return null;
    
    try {
      return URL.createObjectURL(recordedBlob);
    } catch (error) {
      console.error('Failed to create preview URL:', error);
      return null;
    }
  }, [recordedBlob]);

  React.useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  React.useEffect(() => {
    setOptions(prev => ({
      ...prev,
      resolution: appState.settings.defaultResolution,
      frameRate: appState.settings.defaultFrameRate,
      highlightClicks: appState.settings.highlightClicksDefault,
    }));
  }, [appState.settings]);

  React.useEffect(() => {
    return () => {
      if (recordingServiceRef.current) {
        recordingServiceRef.current.cleanup();
      }
      stopTimer();
      if (recordedBlob) {
        try {
          URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [recordedBlob, stopTimer]);

  return (
    <RecordingContext.Provider value={{
      state,
      duration,
      recordedBlob,
      options,
      permissionStatus,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      deleteRecording,
      restartRecording,
      updateOptions,
      getPreviewUrl,
      checkPermissions,
      requestPermissions,
    }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }
  return context;
}
