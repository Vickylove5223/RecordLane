import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { TokenService } from '../services/tokenService';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

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
      
      // Check if we have valid tokens
      const validToken = await TokenService.getValidAccessToken();
      const userInfo = TokenService.getUserInfo();
      
      if (validToken && userInfo) {
        setIsConnected(true);
        setUserEmail(userInfo.email);
      } else {
        setIsConnected(false);
        setUserEmail(null);
        if (!validToken) {
          setConnectionError('Not connected to YouTube');
        }
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
      // Get OAuth configuration from backend
      const config = await backend.auth.getConfig();
      
      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      
      // Store PKCE parameters for later use
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);
      
      // Build OAuth URL
      const redirectUri = getRedirectUri();
      const scope = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ');
      
      const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauthUrl.searchParams.set('client_id', config.clientID);
      oauthUrl.searchParams.set('redirect_uri', redirectUri);
      oauthUrl.searchParams.set('response_type', 'code');
      oauthUrl.searchParams.set('scope', scope);
      oauthUrl.searchParams.set('access_type', 'offline');
      oauthUrl.searchParams.set('prompt', 'consent');
      oauthUrl.searchParams.set('include_granted_scopes', 'true');
      oauthUrl.searchParams.set('code_challenge', codeChallenge);
      oauthUrl.searchParams.set('code_challenge_method', 'S256');
      oauthUrl.searchParams.set('state', state);
      
      // Open popup for OAuth
      const popup = window.open(
        oauthUrl.toString(),
        'google_oauth',
        'width=500,height=700,scrollbars=yes,resizable=yes,centerscreen=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      
      // Wait for OAuth completion
      const result = await waitForOAuthCompletion(popup, state);
      
      // Exchange code for tokens
      const tokenResponse = await backend.auth.exchangeCode({
        code: result.code,
        codeVerifier: codeVerifier,
        redirectUri: redirectUri,
      });
      
      // Store tokens
      TokenService.storeTokens({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
        scope: tokenResponse.scope,
        id_token: tokenResponse.id_token,
      });
      
      // Get user info from ID token
      const userInfo = parseJWT(tokenResponse.id_token);
      TokenService.storeUserInfo(userInfo);
      
      setIsConnected(true);
      setUserEmail(userInfo.email);
      
      toast({
        title: "YouTube Connected",
        description: "Successfully connected to YouTube",
      });
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      setConnectionError(error.message || 'Failed to connect to YouTube');
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to YouTube",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      
      // Clean up session storage
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
    }
  }, [toast]);

  const disconnectYouTube = useCallback(async () => {
    try {
      TokenService.clearTokens();
      
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
    blob: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: any) => void
  ) => {
    if (!isConnected) {
      throw ErrorHandler.createError('YOUTUBE_NOT_CONNECTED', 'YouTube not connected');
    }
    
    try {
      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('NO_VALID_TOKEN', 'No valid access token available');
      }
      
      // Create form data for upload
      const metadata = {
        snippet: {
          title: title,
          description: 'Recorded with RecordLane',
          tags: ['RecordLane', 'screen-recording'],
          categoryId: '28', // Science & Technology
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false,
        },
      };
      
      const formData = new FormData();
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('file', blob, `${title}.webm`);
      
      // Upload to YouTube via resumable upload
      const uploadResult = await uploadToYouTube(accessToken, formData, onProgress);
      
      return uploadResult;
    } catch (error) {
      console.error('Failed to upload video:', error);
      ErrorHandler.logError('youtube-upload', error, { title, privacy, fileSize: blob.size });
      
      throw ErrorHandler.createError('UPLOAD_FAILED', 'Failed to upload video to YouTube', error);
    }
  }, [isConnected]);

  const refreshToken = useCallback(async () => {
    try {
      const tokenData = TokenService.getStoredTokenData();
      if (!tokenData?.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await backend.auth.refreshToken({
        refreshToken: tokenData.refreshToken,
      });
      
      // Update stored tokens
      TokenService.storeTokens({
        access_token: response.access_token,
        refresh_token: tokenData.refreshToken, // Keep existing refresh token
        expires_in: response.expires_in,
        token_type: response.token_type,
        scope: response.scope,
        id_token: response.id_token,
      });
      
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
      TokenService.clearTokens();
      
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

// Helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

function base64URLEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getRedirectUri(): string {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${origin}/auth/callback`;
  }
  
  if (hostname.includes('.lp.dev')) {
    return `${origin}/auth/callback`;
  }
  
  return 'https://recordlane.com/auth/callback';
}

function waitForOAuthCompletion(popup: Window, expectedState: string): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      popup.close();
      reject(new Error('OAuth timeout'));
    }, 5 * 60 * 1000); // 5 minute timeout

    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'oauth_success') {
        clearTimeout(timeout);
        window.removeEventListener('message', messageListener);
        popup.close();

        if (event.data.state !== expectedState) {
          reject(new Error('OAuth state mismatch'));
          return;
        }

        resolve({
          code: event.data.code,
          state: event.data.state,
        });
      } else if (event.data.type === 'oauth_error') {
        clearTimeout(timeout);
        window.removeEventListener('message', messageListener);
        popup.close();
        reject(new Error(event.data.error_description || event.data.error));
      }
    };

    window.addEventListener('message', messageListener);

    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        clearTimeout(timeout);
        window.removeEventListener('message', messageListener);
        reject(new Error('OAuth popup was closed'));
      }
    }, 1000);
  });
}

function parseJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return {};
  }
}

async function uploadToYouTube(
  accessToken: string,
  formData: FormData,
  onProgress?: (progress: any) => void
): Promise<{ videoId: string; videoUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage,
        });
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          const videoId = response.id;
          const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          resolve({ videoId, videoUrl });
        } catch (error) {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload network error'));
    });
    
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout'));
    });
    
    xhr.open('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.timeout = 30 * 60 * 1000; // 30 minute timeout
    
    xhr.send(formData);
  });
}
