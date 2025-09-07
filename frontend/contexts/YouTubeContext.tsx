import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { useToast } from '@/components/ui/use-toast';
import { RealYouTubeService } from '../services/realYouTubeService';
import { FrontendYouTubeService } from '../services/frontendYouTubeService';
import { PersistentTokenService } from '../services/persistentTokenService';
import { DEV_CONFIG, isYouTubeConfigured } from '../config';

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

  // Check for persistent tokens on mount
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        await checkConnection();
      } catch (error) {
        console.error('Failed to initialize YouTube connection:', error);
      }
    };

    initializeConnection();
  }, [checkConnection]);

  const checkConnection = useCallback(async () => {
    try {
      setConnectionError(null);
      
      // First check if we have persistent tokens
      const hasValidTokens = await PersistentTokenService.hasValidTokens();
      if (hasValidTokens) {
        // Try to get user email from stored tokens
        const email = await PersistentTokenService.getUserEmail();
        if (email) {
          setIsConnected(true);
          setUserEmail(email);
          console.log('✅ YouTube connection restored from persistent tokens');
          return;
        }
      }
      
      // If no persistent tokens, try the regular connection flow
      let connection;
      if (isYouTubeConfigured()) {
        // Use frontend service if YouTube is configured with environment variables
        connection = await FrontendYouTubeService.checkConnection();
      } else {
        // Use Supabase service
        connection = await RealYouTubeService.checkConnection();
      }
      
      setIsConnected(connection.isConnected);
      setUserEmail(connection.userEmail);
      
      if (!connection.isConnected) {
        setConnectionError('Not Connected to YouTube');
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
      // Use Supabase service for YouTube OAuth
      const result = await RealYouTubeService.connect();
      
      setIsConnected(true);
      setUserEmail(result.userEmail);
      
      // Store tokens persistently if available
      if (result.tokens) {
        try {
          await PersistentTokenService.storeTokens(result.tokens);
          console.log('✅ YouTube tokens stored persistently');
        } catch (tokenError) {
          console.warn('Failed to store tokens persistently:', tokenError);
          // Don't fail the connection if token storage fails
        }
      }
      
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
        description: "Failed to connect to YouTube. Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnectYouTube = useCallback(async () => {
    try {
      await RealYouTubeService.disconnect();
      
      // Clear persistent tokens
      await PersistentTokenService.clearTokens();
      
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
      // Use the appropriate service
      let result;
      if (isYouTubeConfigured()) {
        result = await FrontendYouTubeService.uploadVideo(file, title, privacy, onProgress);
      } else {
        result = await RealYouTubeService.uploadVideo(file, title, privacy, onProgress);
      }
      
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
      // Use the appropriate service
      let refreshed;
      if (isYouTubeConfigured()) {
        refreshed = await FrontendYouTubeService.refreshAccessToken();
      } else {
        refreshed = await RealYouTubeService.refreshAccessToken();
      }
      
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
