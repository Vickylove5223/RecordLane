import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';
import { RealYouTubeService } from '../services/realYouTubeService';
import { DEV_CONFIG } from '../config';

// Real YouTube context with backend integration
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
      
      if (DEV_CONFIG.mockAPI) {
        // Fallback to demo mode if enabled
        const hasTokens = localStorage.getItem('recordlane-access-token');
        const storedEmail = localStorage.getItem('recordlane-user-email');
        
        setIsConnected(!!hasTokens);
        setUserEmail(storedEmail);
        
        if (!hasTokens) {
          setConnectionError('Not connected to YouTube');
        }
        return;
      }
      
      // Use real YouTube service
      const connection = await RealYouTubeService.checkConnection();
      setIsConnected(connection.isConnected);
      setUserEmail(connection.userEmail);
      
      if (!connection.isConnected) {
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
      if (DEV_CONFIG.mockAPI) {
        // Demo mode fallback
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockEmail = 'demo@example.com';
        localStorage.setItem('recordlane-access-token', 'demo-token');
        localStorage.setItem('recordlane-user-email', mockEmail);
        
        setIsConnected(true);
        setUserEmail(mockEmail);
        
        toast({
          title: "Demo Mode",
          description: "YouTube connection simulated for demo purposes",
        });
        return;
      }
      
      // Use real YouTube service
      const result = await RealYouTubeService.connect();
      setIsConnected(true);
      setUserEmail(result.userEmail);
      
      toast({
        title: "YouTube Connected",
        description: `Successfully connected as ${result.userEmail}`,
      });
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      setConnectionError('Failed to connect to YouTube');
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to YouTube. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectYouTube = useCallback(async () => {
    try {
      if (!DEV_CONFIG.mockAPI) {
        await RealYouTubeService.disconnect();
      } else {
        localStorage.removeItem('recordlane-access-token');
        localStorage.removeItem('recordlane-user-email');
      }
      
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
      
      // Clear local state even if disconnect fails
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-user-email');
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError(null);
      
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
      if (DEV_CONFIG.mockAPI) {
        // Demo mode fallback
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          onProgress?.({ loaded: i, total: 100, percentage: i });
        }
        
        const mockVideoId = 'demo_' + Date.now();
        const mockVideoUrl = `https://www.youtube.com/watch?v=${mockVideoId}`;
        
        return { videoId: mockVideoId, videoUrl: mockVideoUrl };
      }
      
      // Use real YouTube service
      const result = await RealYouTubeService.uploadVideo(file, title, privacy, onProgress);
      
      toast({
        title: "Upload Successful",
        description: `Video uploaded successfully: ${result.videoUrl}`,
      });
      
      return result;
    } catch (error) {
      console.error('Failed to upload video:', error);
      ErrorHandler.logError('youtube-upload', error);
      
      toast({
        title: "Upload Failed",
        description: "Failed to upload video to YouTube",
        variant: "destructive",
      });
      
      throw ErrorHandler.createError('UPLOAD_FAILED', 'Failed to upload video');
    }
  }, [isConnected, toast]);

  const refreshToken = useCallback(async () => {
    try {
      if (DEV_CONFIG.mockAPI) {
        // Demo mode fallback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: "Token Refreshed",
          description: "Authentication token has been refreshed successfully",
        });
        return;
      }
      
      // Use real YouTube service
      const refreshed = await RealYouTubeService.refreshAccessToken();
      
      if (refreshed) {
        toast({
          title: "Token Refreshed",
          description: "Authentication token has been refreshed successfully",
        });
      } else {
        throw new Error('Token refresh failed');
      }
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

  // Initialize connection check - only in demo mode to avoid backend dependency
  React.useEffect(() => {
    if (DEV_CONFIG.mockAPI) {
      checkConnection();
    }
    // For real mode, connection will be checked when user tries to connect
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
