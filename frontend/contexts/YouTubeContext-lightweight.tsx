import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

  const checkConnection = useCallback(async () => {
    // Lightweight check - just check localStorage for now
    try {
      const savedTokens = localStorage.getItem('recordlane-token-cache');
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        const expiresAt = new Date(tokens.expires_at);
        
        if (expiresAt.getTime() > Date.now() + (5 * 60 * 1000)) {
          setIsConnected(true);
          setUserEmail(tokens.userEmail || 'Connected User');
          return;
        }
      }
      
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError('Not Connected to YouTube');
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError('Failed to check connection status');
    }
  }, []);

  const connectYouTube = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Simulate connection for now - replace with actual OAuth later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setUserEmail('demo@example.com');
      
      // Store mock tokens
      const mockTokens = {
        access_token: 'mock_token',
        refresh_token: 'mock_refresh',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        userEmail: 'demo@example.com'
      };
      localStorage.setItem('recordlane-token-cache', JSON.stringify(mockTokens));
      
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      setConnectionError('Failed to connect to YouTube');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectYouTube = useCallback(async () => {
    try {
      localStorage.removeItem('recordlane-token-cache');
      setIsConnected(false);
      setUserEmail(null);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
    }
  }, []);

  const uploadVideo = useCallback(async (
    file: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted', 
    onProgress?: (progress: any) => void
  ) => {
    // Mock upload for now
    return new Promise<{ videoId: string; videoUrl: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          videoId: 'mock_video_id',
          videoUrl: 'https://youtube.com/watch?v=mock_video_id'
        });
      }, 2000);
    });
  }, []);

  const retryConnection = useCallback(async () => {
    await checkConnection();
  }, [checkConnection]);

  const refreshToken = useCallback(async () => {
    // Mock token refresh
    console.log('Token refresh requested');
  }, []);

  // Check connection on mount
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
