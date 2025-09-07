import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { RetryService } from '../utils/retryService';
import { 
  UPLOAD_CONFIG, 
  ERROR_MESSAGES,
  OAUTH_CONFIG,
  getRedirectUri,
  POPUP_CONFIG,
  DEV_CONFIG
} from '../config';
// Dynamic import to avoid build-time errors when backend is not available
let backend: any = null;

export interface YouTubeConnection {
  isConnected: boolean;
  userEmail: string | null;
}

export interface UploadResult {
  videoId: string;
  videoUrl: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

export class RealYouTubeService {
  private static cache = new CacheService('youtube-service');
  private static retryService = new RetryService();
  private static connectionListeners: Array<(connected: boolean) => void> = [];
  private static oauthConfig: typeof OAUTH_CONFIG | null = null;
  private static initializationPromise: Promise<void> | null = null;

  static initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    this.initializationPromise = (async () => {
      // Load OAuth config from backend
      await this.loadOAuthConfig();
    })();
    return this.initializationPromise;
  }

  private static async loadOAuthConfig() {
    try {
      // Dynamically import backend client
      if (!backend) {
        const backendModule = await import('~backend/client');
        backend = backendModule.default;
      }
      
      const config = await backend.auth.getConfig();
      this.oauthConfig = {
        ...OAUTH_CONFIG,
        clientId: config.clientID,
      };
      console.log('OAuth config loaded from backend successfully');
    } catch (error) {
      console.error('Failed to load OAuth config from backend:', error);
      ErrorHandler.logError('oauth-config-load', error);
      
      // Throw error to indicate backend is not available
      throw new Error('Backend server is not running. Please start the backend server to enable YouTube integration.');
    }
  }

  static addConnectionListener(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private static notifyConnectionChange(connected: boolean): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  static async checkConnection(): Promise<YouTubeConnection> {
    await this.initialize();
    try {
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 60 * 1000) {
        return cached.data as YouTubeConnection;
      }

      // Check for stored tokens
      const tokenData = this.getStoredTokenData();
      
      if (!tokenData || !tokenData.accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result, 30 * 1000);
        this.notifyConnectionChange(false);
        return result;
      }

      // Validate token by making a test API call
      const isValid = await this.validateToken(tokenData.accessToken);
      
      if (!isValid) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          this.clearTokens();
          const result = { isConnected: false, userEmail: null };
          await this.cache.set('connection-status', result, 30 * 1000);
          this.notifyConnectionChange(false);
          return result;
        }
      }

      const result = {
        isConnected: true,
        userEmail: tokenData.userEmail || null,
      };

      await this.cache.set('connection-status', result, 5 * 60 * 1000);
      this.notifyConnectionChange(true);
      return result;
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      const result = { isConnected: false, userEmail: null };
      await this.cache.set('connection-status', result, 30 * 1000);
      this.notifyConnectionChange(false);
      return result;
    }
  }

  static async connect(): Promise<{ userEmail: string }> {
    await this.initialize();
    try {
      await this.cache.delete('connection-status');
      
      if (!this.oauthConfig?.clientId) {
        throw new Error('OAuth configuration not available from backend');
      }

      // Generate PKCE parameters
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      // Store PKCE parameters for later use
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);

      // Build authorization URL
      const authUrl = this.buildAuthUrl(codeChallenge, state);
      
      // Open OAuth popup
      const code = await this.openOAuthPopup(authUrl, state);
      
      // Exchange code for tokens
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
      
      // Store tokens
      this.storeTokens(tokenData);
      
      // Get user info
      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      const result = {
        userEmail: userInfo.email,
      };

      await this.cache.set('connection-status', {
        isConnected: true,
        userEmail: userInfo.email,
      }, 5 * 60 * 1000);
      
      this.notifyConnectionChange(true);
      return result;
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      this.clearTokens();
      await this.cache.delete('connection-status');
      this.notifyConnectionChange(false);
      
      throw ErrorHandler.createError('CONNECTION_FAILED', 'Failed to connect to YouTube', error);
    }
  }

  static async disconnect(): Promise<void> {
    try {
      this.clearTokens();
      await this.cache.clear();
      this.notifyConnectionChange(false);
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
      ErrorHandler.logError('youtube-disconnect', error);
      this.clearTokens();
      await this.cache.clear();
      this.notifyConnectionChange(false);
      throw error;
    }
  }

  static async uploadVideo(
    blob: Blob, 
    title: string, 
    privacyStatus: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    await this.initialize();
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      // Validate token
      const isValid = await this.validateToken(tokenData.accessToken);
      if (!isValid) {
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          throw ErrorHandler.createError('AUTH_REQUIRED', 'Authentication required');
        }
      }

      // Upload to YouTube
      const result = await this.performYouTubeUpload(blob, title, privacyStatus, onProgress);
      
      return result;
    } catch (error) {
      console.error('Failed to upload video:', error);
      ErrorHandler.logError('youtube-upload', error, { title, privacyStatus, fileSize: blob.size });
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
  }

  static async deleteVideo(videoId: string): Promise<void> {
    console.log('RealYouTubeService.deleteVideo called with videoId:', videoId);
    await this.initialize();
    try {
      const tokenData = this.getStoredTokenData();
      console.log('Token data available:', !!tokenData?.accessToken);
      if (!tokenData?.accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', 'Authentication required');
      }

      // Validate token
      console.log('Validating token...');
      const isValid = await this.validateToken(tokenData.accessToken);
      console.log('Token is valid:', isValid);
      if (!isValid) {
        console.log('Token invalid, attempting refresh...');
        const refreshed = await this.refreshAccessToken();
        console.log('Token refresh successful:', refreshed);
        if (!refreshed) {
          throw ErrorHandler.createError('AUTH_REQUIRED', 'Authentication required');
        }
      }

      // Delete from YouTube
      const deleteUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`;
      console.log('Making DELETE request to:', deleteUrl);
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
        },
      });

      console.log('Delete response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed with response:', errorText);
        
        // Parse error response for better error messages
        let errorMessage = 'Failed to delete video from YouTube';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            if (errorData.error.code === 403) {
              errorMessage = 'Permission denied. You may not have permission to delete this video.';
            } else if (errorData.error.code === 404) {
              errorMessage = 'Video not found. It may have already been deleted.';
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      console.log('Video deleted successfully from YouTube:', videoId);
    } catch (error) {
      console.error('Failed to delete video from YouTube:', error);
      ErrorHandler.logError('youtube-delete', error, { videoId });
      throw ErrorHandler.createError('DELETE_FAILED', (error as Error).message || 'Failed to delete video from YouTube', error);
    }
  }

  // PKCE Helper Methods
  private static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static buildAuthUrl(codeChallenge: string, state: string): string {
    if (!this.oauthConfig?.clientId) {
      throw new Error('OAuth configuration not available');
    }

    const params = new URLSearchParams({
      client_id: this.oauthConfig.clientId,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: this.oauthConfig.scope,
      access_type: 'offline',
      prompt: 'consent',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private static async openOAuthPopup(authUrl: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;
      const popupWidth = POPUP_CONFIG.width;
      const popupHeight = POPUP_CONFIG.height;
      const left = (screenWidth - popupWidth) / 2;
      const top = (screenHeight - popupHeight) / 2;

      const popup = window.open(
        authUrl, 
        POPUP_CONFIG.windowName, 
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=${POPUP_CONFIG.scrollbars},resizable=${POPUP_CONFIG.resizable},status=no,menubar=no,toolbar=no,location=no`
      );
      
      if (!popup) {
        return reject(ErrorHandler.createError('POPUP_BLOCKED', ERROR_MESSAGES.POPUP_BLOCKED));
      }

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'oauth_success' || event.data.type === 'OAUTH_SUCCESS') {
          clearTimeout(timeout);
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.state !== expectedState) {
            return reject(ErrorHandler.createError('INVALID_STATE', ERROR_MESSAGES.INVALID_STATE));
          }
          
          console.log('Authorization code received via message');
          resolve(event.data.code);
        } else if (event.data.type === 'oauth_error' || event.data.type === 'OAUTH_ERROR') {
          clearTimeout(timeout);
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.error === 'access_denied') {
            return reject(ErrorHandler.createError('USER_CANCELLED', 'User denied access'));
          }
          return reject(ErrorHandler.createError('OAUTH_ERROR', `OAuth error: ${event.data.error}`));
        }
      };
      
      window.addEventListener('message', messageHandler);

      const timeout = setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        window.removeEventListener('message', messageHandler);
        reject(ErrorHandler.createError('POPUP_TIMEOUT', ERROR_MESSAGES.POPUP_TIMEOUT));
      }, POPUP_CONFIG.timeout);

      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            return reject(ErrorHandler.createError('POPUP_CLOSED', ERROR_MESSAGES.POPUP_CLOSED));
          }

          // Don't try to access popup.location.href to avoid COOP errors
          // The OAuth flow will be handled entirely via postMessage from the callback page
        } catch (error) {
          if ((error as Error).name !== 'SecurityError') {
            console.warn('Unexpected error during popup polling:', error);
          }
        }
      }, POPUP_CONFIG.pollInterval);
    });
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenData> {
    try {
      // Ensure backend is loaded
      if (!backend) {
        const backendModule = await import('~backend/client');
        backend = backendModule.default;
      }
      
      const result = await backend.auth.exchangeCode({
        code,
        codeVerifier,
        redirectUri: getRedirectUri(),
      });
      
      return result;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw ErrorHandler.createError('CODE_EXCHANGE_FAILED', ERROR_MESSAGES.CODE_EXCHANGE_FAILED, error);
    }
  }

  static async refreshAccessToken(): Promise<boolean> {
    await this.initialize();
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.refreshToken) {
        return false;
      }

      // Ensure backend is loaded
      if (!backend) {
        const backendModule = await import('~backend/client');
        backend = backendModule.default;
      }

      const result = await backend.auth.refreshToken({
        refreshToken: tokenData.refreshToken,
      });

      // Update stored tokens
      const updatedTokenData: TokenData = {
        access_token: result.access_token,
        refresh_token: tokenData.refreshToken, // Keep existing refresh token
        expires_in: result.expires_in,
        scope: result.scope,
        token_type: result.token_type,
        id_token: result.id_token || tokenData.idToken || '',
      };

      this.storeTokens(updatedTokenData);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  private static async getUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await response.json();
      return {
        email: userInfo.email,
        name: userInfo.name,
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }

  private static async performYouTubeUpload(
    blob: Blob, 
    title: string, 
    privacyStatus: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const tokenData = this.getStoredTokenData();
    if (!tokenData?.accessToken) {
      throw new Error('No access token available');
    }

    // Create video metadata
    const metadata = {
      snippet: {
        title: title,
        description: `Recorded with RecordLane - ${new Date().toISOString()}`,
        tags: ['RecordLane', 'Screen Recording'],
        categoryId: '22', // People & Blogs
      },
      status: {
        privacyStatus: privacyStatus,
      },
    };

    // Step 1: Initialize upload
    const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      throw new Error(`Failed to initialize upload: ${errorText}`);
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL received');
    }

    // Step 2: Upload video data
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*',
        'Content-Length': blob.size.toString(),
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const result = await uploadResponse.json();
    
    return {
      videoId: result.id,
      videoUrl: `https://www.youtube.com/watch?v=${result.id}`,
    };
  }

  // Token Management
  private static getStoredTokenData(): { accessToken: string; refreshToken: string; userEmail: string; idToken: string } | null {
    try {
      const accessToken = localStorage.getItem('recordlane-access-token');
      const refreshToken = localStorage.getItem('recordlane-refresh-token');
      const userEmail = localStorage.getItem('recordlane-user-email');
      const idToken = localStorage.getItem('recordlane-id-token');

      if (!accessToken) return null;

      return {
        accessToken,
        refreshToken: refreshToken || '',
        userEmail: userEmail || '',
        idToken: idToken || '',
      };
    } catch (error) {
      console.error('Failed to get stored token data:', error);
      return null;
    }
  }

  private static storeTokens(tokenData: TokenData): void {
    try {
      localStorage.setItem('recordlane-access-token', tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem('recordlane-refresh-token', tokenData.refresh_token);
      }
      if (tokenData.id_token) {
        localStorage.setItem('recordlane-id-token', tokenData.id_token);
      }
      
      console.log('Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  private static clearTokens(): void {
    try {
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-refresh-token');
      localStorage.removeItem('recordlane-user-email');
      localStorage.removeItem('recordlane-id-token');
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      
      console.log('All tokens cleared');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Handle OAuth callback
  static handleOAuthCallback() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('OAuth callback detected:', { 
          hasCode: !!code, 
          error, 
          currentUrl: window.location.href,
        });
        
        if (window.opener && window.opener !== window) {
          try {
            if (error) {
              window.opener.postMessage({
                type: 'oauth_error',
                error: error,
                errorDescription: urlParams.get('error_description')
              }, window.location.origin);
            } else if (code) {
              window.opener.postMessage({
                type: 'oauth_success',
                code: code,
                state: urlParams.get('state')
              }, window.location.origin);
            }
            window.close();
          } catch (e) {
            console.error('Failed to communicate with parent window:', e);
          }
        }
      }
    }
  }
}

// Initialize OAuth callback handling when module loads
if (typeof window !== 'undefined') {
  RealYouTubeService.handleOAuthCallback();
}
