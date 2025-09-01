import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { RecordingService } from '../services/recordingService';
import { useToast } from '@/components/ui/use-toast';

export type RecordingMode = 'screen' | 'camera' | 'screen-camera';
export type RecordingState = 'idle' | 'starting' | 'recording' | 'paused' | 'stopped';

interface RecordingOptions {
  mode: RecordingMode;
  highlightClicks: boolean;
  enableDrawing: boolean;
  resolution: '480p' | '720p' | '1080p';
  frameRate: 30 | 60;
}

interface RecordingContextType {
  state: RecordingState;
  duration: number;
  recordedBlob: Blob | null;
  options: RecordingOptions;
  
  startRecording: (options: RecordingOptions) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  deleteRecording: () => void;
  restartRecording: () => void;
  
  updateOptions: (options: Partial<RecordingOptions>) => void;
  getPreviewUrl: () => string | null;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [options, setOptions] = useState<RecordingOptions>({
    mode: 'screen',
    highlightClicks: true,
    enableDrawing: false,
    resolution: '720p',
    frameRate: 30,
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

  const startRecording = useCallback(async (recordingOptions: RecordingOptions) => {
    try {
      setState('starting');
      setDuration(0);
      setRecordedBlob(null);
      setOptions(recordingOptions);

      recordingServiceRef.current = new RecordingService();
      
      await recordingServiceRef.current.startRecording(recordingOptions);
      
      setState('recording');
      startTimer();
      
      toast({
        title: "Recording Started",
        description: "Your screen recording has started",
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState('idle');
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [startTimer, toast]);

  const pauseRecording = useCallback(() => {
    if (recordingServiceRef.current && state === 'recording') {
      recordingServiceRef.current.pauseRecording();
      setState('paused');
      stopTimer();
    }
  }, [state, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (recordingServiceRef.current && state === 'paused') {
      recordingServiceRef.current.resumeRecording();
      setState('recording');
      startTimer();
    }
  }, [state, startTimer]);

  const stopRecording = useCallback(async () => {
    if (recordingServiceRef.current && (state === 'recording' || state === 'paused')) {
      try {
        const blob = await recordingServiceRef.current.stopRecording();
        setRecordedBlob(blob);
        setState('stopped');
        stopTimer();
        
        toast({
          title: "Recording Stopped",
          description: "Your recording is ready for review",
        });
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setState('idle');
        toast({
          title: "Stop Failed",
          description: "Failed to stop recording properly",
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
      URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
    }
    
    setRecordedBlob(null);
    setState('idle');
    setDuration(0);
    stopTimer();
  }, [recordedBlob, stopTimer]);

  const restartRecording = useCallback(async () => {
    deleteRecording();
    // Wait a bit for cleanup
    setTimeout(() => {
      startRecording(options);
    }, 100);
  }, [deleteRecording, startRecording, options]);

  const updateOptions = useCallback((newOptions: Partial<RecordingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);

  const getPreviewUrl = useCallback(() => {
    return recordedBlob ? URL.createObjectURL(recordedBlob) : null;
  }, [recordedBlob]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recordingServiceRef.current) {
        recordingServiceRef.current.cleanup();
      }
      stopTimer();
      if (recordedBlob) {
        URL.revokeObjectURL(URL.createObjectURL(recordedBlob));
      }
    };
  }, [recordedBlob, stopTimer]);

  return (
    <RecordingContext.Provider value={{
      state,
      duration,
      recordedBlob,
      options,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      deleteRecording,
      restartRecording,
      updateOptions,
      getPreviewUrl,
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
