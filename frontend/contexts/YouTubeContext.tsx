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
      throw ErrorHandler.createError('YOUTUBE_NOT_CONNECTED', 'YouTube not connected');
    }
    
    try {
      return await retryService.execute(
        () => YouTubeService.uploadVideo(file, title, privacy, onProgress),
        {
          maxRetries: 3,
          retryDelay: 2000,
          shouldRetry: (error) => {
            if (error.code === 'AUTH_EXPIRED' || error.code === 'AUTH_TOKEN_INVALID') {
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
      if (error.code === 'AUTH_EXPIRED' || error.code === 'AUTH_TOKEN_INVALID') {
        setIsConnected(false);
        setUserEmail(null);
        setConnectionError('Authentication expired, please reconnect');
      }
      throw error;
    }
  }, [isConnected, retryService, toast]);

  const refreshToken = useCallback(async () => {
    try {
      const newToken = await TokenService.refreshAccessToken();
      
      if (newToken) {
        // Check connection again after successful refresh
        await checkConnection();
        
        toast({
          title: "Token Refreshed",
          description: "Authentication token has been refreshed successfully",
        });
      } else {
        // Refresh failed, user needs to reconnect
        setIsConnected(false);
        setUserEmail(null);
        setConnectionError('Session expired, please reconnect your YouTube account');
        
        toast({
          title: "Session Expired",
          description: "Please reconnect your YouTube account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      ErrorHandler.logError('token-refresh-context', error);
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError('Session expired, please reconnect your YouTube account');
      
      toast({
        title: "Token Refresh Failed",
        description: "Please reconnect your YouTube account",
        variant: "destructive",
      });
    }
  }, [checkConnection, toast]);

  const retryConnection = useCallback(async () => {
    if (connectionError) {
      await connectYouTube();
    } else {
      await checkConnection();
    }
  }, [connectionError, connectYouTube, checkConnection]);

  // Enhanced connection monitoring with token refresh integration
  React.useEffect(() => {
    checkConnection();
    
    // Set up YouTube service connection listener
    const unsubscribeYouTube = YouTubeService.addConnectionListener((connected) => {
      setIsConnected(connected);
      if (!connected) {
        setUserEmail(null);
        setConnectionError('Connection lost');
      }
    });
    
    // Set up token refresh listener
    const unsubscribeToken = TokenService.addRefreshListener((success, token) => {
      if (!success) {
        console.log('Token refresh failed in context, updating connection state');
        setIsConnected(false);
        setUserEmail(null);
        setConnectionError('Authentication session expired, please reconnect');
      } else {
        console.log('Token refreshed successfully in context');
        // Optionally recheck connection after successful refresh
        checkConnection().catch(error => {
          console.error('Failed to recheck connection after token refresh:', error);
        });
      }
    });
    
    // Periodic token validation (every 5 minutes)
    const tokenCheckInterval = setInterval(async () => {
      if (isConnected) {
        const tokenExpiry = TokenService.getTokenExpiry();
        
        if (tokenExpiry?.isExpired) {
          console.log('Token expired, attempting refresh...');
          await refreshToken();
        } else if (tokenExpiry?.isNearExpiry) {
          console.log('Token near expiry, proactively refreshing...');
          try {
            await TokenService.refreshAccessToken();
          } catch (error) {
            console.error('Proactive token refresh failed:', error);
          }
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      unsubscribeYouTube();
      unsubscribeToken();
      clearInterval(tokenCheckInterval);
    };
  }, [checkConnection, isConnected, refreshToken]);

  // Handle page visibility changes for token validation
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isConnected) {
        // Check token validity when page becomes visible
        const tokenExpiry = TokenService.getTokenExpiry();
        
        if (tokenExpiry?.isExpired) {
          console.log('Page visible and token expired, refreshing...');
          refreshToken();
        } else if (!TokenService.getValidAccessToken()) {
          console.log('Page visible but no valid token, disconnecting...');
          setIsConnected(false);
          setUserEmail(null);
          setConnectionError('Authentication session expired, please reconnect');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, refreshToken]);

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
