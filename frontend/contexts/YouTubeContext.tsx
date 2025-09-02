import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { YouTubeService, UploadProgress } from '../services/youtubeService';
import { TokenService } from '../services/tokenService';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';

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
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<{ videoId: string; videoUrl: string }>;
  checkConnection: () => Promise<void>;
  retryConnection: () => Promise<void>;
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
      
      const connection = await retryService.execute(
        () => YouTubeService.checkConnection(),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => ErrorHandler.isRecoverableError(error),
        }
      );
      
      setIsConnected(connection.isConnected);
      setUserEmail(connection.userEmail);
      
      if (connection.isConnected) {
        setConnectionError(null);
      }
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      setIsConnected(false);
      setUserEmail(null);
      
      const errorMessage = ErrorHandler.formatErrorForUser(error);
      setConnectionError(errorMessage);
    }
  }, [retryService]);

  const connectYouTube = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await retryService.execute(
        () => YouTubeService.connect(),
        {
          maxRetries: 1,
          retryDelay: 2000,
          shouldRetry: (error) => {
            return ErrorHandler.isRecoverableError(error) && 
                   !error.message?.includes('popup') &&
                   !error.message?.includes('cancelled') &&
                   !error.message?.includes('denied');
          },
          onRetry: (error, attempt) => {
            toast({
              title: "Connection Retry",
              description: `Retrying connection attempt ${attempt}...`,
            });
          }
        }
      );
      
      setIsConnected(true);
      setUserEmail(result.userEmail);
      
      toast({
        title: "YouTube Connected",
        description: `Successfully connected to ${result.userEmail}`,
      });
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      const errorMessage = ErrorHandler.formatErrorForUser(error);
      setConnectionError(errorMessage);
      
      if (!error.message?.includes('cancelled') && !error.message?.includes('popup was closed')) {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [toast, retryService]);

  const disconnectYouTube = useCallback(async () => {
    try {
      await retryService.execute(
        () => YouTubeService.disconnect(),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: () => true,
        }
      );
      
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
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError(null);
      
      toast({
        title: "Disconnect Warning",
        description: "Local connection cleared, but Google may still show authorization",
        variant: "destructive",
      });
    }
  }, [toast, retryService]);

  const uploadVideo = useCallback(async (
    file: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: UploadProgress) => void
  ) => {
    if (!isConnected) {
      throw ErrorHandler.createError('DRIVE_NOT_CONNECTED', 'YouTube not connected');
    }
    
    try {
      return await retryService.execute(
        () => YouTubeService.uploadVideo(file, title, privacy, onProgress),
        {
          maxRetries: 3,
          retryDelay: 2000,
          shouldRetry: (error) => {
            if (error.code === 'AUTH_EXPIRED') {
              setIsConnected(false);
              setUserEmail(null);
              setConnectionError('Authentication expired, please reconnect');
              return false;
            }
            return ErrorHandler.isRecoverableError(error) ||
                   (error.status >= 500 && error.status < 600) ||
                   error.status === 429;
          },
          onRetry: (error, attempt) => {
            toast({
              title: "Upload Retry",
              description: `Retrying upload attempt ${attempt}...`,
            });
          }
        }
      );
    } catch (error) {
      if (error.code === 'AUTH_EXPIRED') {
        setIsConnected(false);
        setUserEmail(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      throw error;
    }
  }, [isConnected, retryService, toast]);

  const retryConnection = useCallback(async () => {
    if (connectionError) {
      await connectYouTube();
    } else {
      await checkConnection();
    }
  }, [connectionError, connectYouTube, checkConnection]);

  React.useEffect(() => {
    checkConnection();
    
    const interval = setInterval(() => {
      if (isConnected && TokenService.isTokenNearExpiry()) {
        console.log('Token is near expiry, clearing connection state');
        setIsConnected(false);
        setUserEmail(null);
        setConnectionError('Authentication session expired, please reconnect');
        TokenService.clearTokens();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [checkConnection, isConnected]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected) {
        const token = TokenService.getValidAccessToken();
        if (!token) {
          setIsConnected(false);
          setUserEmail(null);
          setConnectionError('Authentication session expired, please reconnect');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected]);

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
