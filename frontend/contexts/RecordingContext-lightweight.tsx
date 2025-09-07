import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  const [options, setOptions] = useState<RecordingOptions>({
    mode: 'screen',
    highlightClicks: true,
    systemAudio: false,
    microphone: true,
    resolution: '720p',
    frameRate: 30,
  });

  const startRecording = useCallback(async (recordingOptions: RecordingOptions) => {
    setState('starting');
    setOptions(recordingOptions);
    
    try {
      // Mock recording start
      await new Promise(resolve => setTimeout(resolve, 1000));
      setState('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (state === 'recording') {
      setState('paused');
    }
  }, [state]);

  const resumeRecording = useCallback(() => {
    if (state === 'paused') {
      setState('recording');
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (state === 'recording' || state === 'paused') {
      setState('stopped');
      // Mock recorded blob
      setRecordedBlob(new Blob(['mock recording data'], { type: 'video/webm' }));
    }
  }, [state]);

  const deleteRecording = useCallback(() => {
    setRecordedBlob(null);
    setState('idle');
    setDuration(0);
  }, []);

  const restartRecording = useCallback(() => {
    setRecordedBlob(null);
    setState('idle');
    setDuration(0);
  }, []);

  const updateOptions = useCallback((newOptions: Partial<RecordingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const getPreviewUrl = useCallback(() => {
    return recordedBlob ? URL.createObjectURL(recordedBlob) : null;
  }, [recordedBlob]);

  const checkPermissions = useCallback(async () => {
    // Mock permission check
    setPermissionStatus({
      camera: 'granted',
      microphone: 'granted',
      screen: 'granted',
    });
  }, []);

  const requestPermissions = useCallback(async (type: 'camera' | 'microphone' | 'screen') => {
    // Mock permission request
    setPermissionStatus(prev => ({
      ...prev,
      [type]: 'granted',
    }));
    return true;
  }, []);

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
