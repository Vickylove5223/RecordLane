import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';

// Simplified YouTube context without backend dependencies for now
interface YouTubeContextType {
  isConnected: boolean;
  userEmail: string | null;
  isConnecting: boolean;
  connectionError: string | null;
  connectYouTube: () => Promise<void>;
  disconnectYouTube: () => Promise<void>;
  uploadVideo: (
    file: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted', 
    onProgress?: (progress: any) => void
  ) => Promise<{ videoId: string; videoUrl: string }>;
  checkConnection: () => Promise<void>;
  retryConnection: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const YouTubeContext = createContext<YouTubeContextType | undefined>(undefined);

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const retryService = new RetryService();

  const checkConnection = useCallback(async () => {
    try {
      setConnectionError(null);
      
      // For now, just check if we have stored tokens
      const hasTokens = localStorage.getItem('recordlane-access-token');
      const storedEmail = localStorage.getItem('recordlane-user-email');
      
      setIsConnected(!!hasTokens);
      setUserEmail(storedEmail);
      
      if (!hasTokens) {
        setConnectionError('Not connected to YouTube');
      }
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError('Failed to check connection status');
    }
  }, []);

  const connectYouTube = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // For now, simulate a connection without actual OAuth
      // In a real implementation, this would handle the OAuth flow
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, just set connected state
      const mockEmail = 'demo@example.com';
      localStorage.setItem('recordlane-access-token', 'demo-token');
      localStorage.setItem('recordlane-user-email', mockEmail);
      
      setIsConnected(true);
      setUserEmail(mockEmail);
      
      toast({
        title: "Demo Mode",
        description: "YouTube connection simulated for demo purposes",
      });
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      setConnectionError('Failed to connect to YouTube');
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to YouTube. Demo mode available.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectYouTube = useCallback(async () => {
    try {
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-user-email');
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError(null);
      
      toast({
        title: "YouTube Disconnected",
        description: "Successfully disconnected from YouTube",
      });
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
      ErrorHandler.logError('youtube-disconnect', error);
      
      toast({
        title: "Disconnect Error",
        description: "Error during disconnection, but local state cleared",
        variant: "destructive",
      });
    }
  }, [toast]);

  const uploadVideo = useCallback(async (
    file: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: any) => void
  ) => {
    if (!isConnected) {
      throw ErrorHandler.createError('YOUTUBE_NOT_CONNECTED', 'YouTube not connected');
    }
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress?.({ loaded: i, total: 100, percentage: i });
      }
      
      // Simulate successful upload
      const mockVideoId = 'demo_' + Date.now();
      const mockVideoUrl = `https://www.youtube.com/watch?v=${mockVideoId}`;
      
      return { videoId: mockVideoId, videoUrl: mockVideoUrl };
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw ErrorHandler.createError('UPLOAD_FAILED', 'Failed to upload video');
    }
  }, [isConnected]);

  const refreshToken = useCallback(async () => {
    try {
      // Simulate token refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Token Refreshed",
        description: "Authentication token has been refreshed successfully",
      });
    } catch (error) {
      console.error('Failed to refresh token:', error);
      ErrorHandler.logError('token-refresh-context', error);
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError('Session expired, please reconnect');
      
      toast({
        title: "Token Refresh Failed",
        description: "Please reconnect your YouTube account",
        variant: "destructive",
      });
    }
  }, [toast]);

  const retryConnection = useCallback(async () => {
    if (connectionError) {
      await connectYouTube();
    } else {
      await checkConnection();
    }
  }, [connectionError, connectYouTube, checkConnection]);

  // Initialize connection check
  React.useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <YouTubeContext.Provider value={{
      isConnected,
      userEmail,
      isConnecting,
      connectionError,
      connectYouTube,
      disconnectYouTube,
      uploadVideo,
      checkConnection,
      retryConnection,
      refreshToken,
    }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() {
  const context = useContext(YouTubeContext);
  if (context === undefined) {
    throw new Error('useYouTube must be used within a YouTubeProvider');
  }
  return context;
}
