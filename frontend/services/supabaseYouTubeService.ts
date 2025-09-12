import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { 
  UPLOAD_CONFIG, 
  ERROR_MESSAGES,
  OAUTH_CONFIG,
  getRedirectUri,
  POPUP_CONFIG
} from '../config';
import { SUPABASE_CONFIG } from '@/src/config/supabase';

export interface YouTubeConnection {
  isConnected: boolean;
  userEmail: string | null;
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface UserInfo {
  email: string;
  name: string;
  picture?: string;
}

export class SupabaseYouTubeService {
  private static cache = new Map<string, any>();
  private static retryService = new RetryService();
  private static connectionListeners: Array<(connected: boolean) => void> = [];

  private static getApiBase(): string {
    try {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocal) return '/api';
      const functionsBase = `${SUPABASE_CONFIG.url.replace(/\/$/, '')}/functions/v1`;
      return functionsBase;
    } catch {
      return '/api';
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

  static async checkConnection(): Promise<YouTubeConnection> {
    try {
      // Check if we have stored tokens
      const tokenData = this.getStoredTokenData();
      if (!tokenData) {
        return { isConnected: false, userEmail: null };
      }

      // Verify token is still valid by making a test request
      try {
        const userInfo = await this.getUserInfo(tokenData.access_token);
        return { isConnected: true, userEmail: userInfo.email };
      } catch (error) {
        // Token might be expired, try to refresh
        try {
          await this.refreshAccessToken();
          const refreshedTokenData = this.getStoredTokenData();
          if (refreshedTokenData) {
            const userInfo = await this.getUserInfo(refreshedTokenData.access_token);
            return { isConnected: true, userEmail: userInfo.email };
          }
        } catch (refreshError) {
          console.log('Token refresh failed:', refreshError);
        }
        
        // Clear invalid tokens
        this.clearTokens();
        return { isConnected: false, userEmail: null };
      }
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      return { isConnected: false, userEmail: null };
    }
  }

  static async connect(): Promise<{ userEmail: string }> {
    try {
      // Get OAuth config from Supabase Edge Function
      const configResponse = await fetch(`${this.getApiBase()}/auth/config`);
      if (!configResponse.ok) {
        throw new Error('Failed to get OAuth configuration from backend');
      }
      
      const config = await configResponse.json();
      if (!config.clientID) {
        throw new Error('YouTube is not configured. Please set up your Google API credentials in Supabase Edge Functions.');
      }

      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      // Store code verifier for later use
      sessionStorage.setItem('youtube-code-verifier', codeVerifier);
      sessionStorage.setItem('youtube-state', state);

      // Build auth URL with backend client ID
      const authUrl = this.buildAuthUrlWithClientId(codeChallenge, state, config.clientID);
      const code = await this.openOAuthPopup(authUrl, state);
      
      // Exchange code for token using Supabase Edge Function
      const tokenData = await this.exchangeCodeForTokenViaBackend(code, codeVerifier);
      this.storeTokenData(tokenData);

      const userInfo = await this.getUserInfo(tokenData.access_token);
      
      // Notify listeners
      this.connectionListeners.forEach(listener => listener(true));
      
      return { userEmail: userInfo.email };
    } catch (error) {
      console.error('YouTube connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    this.clearTokens();
    this.connectionListeners.forEach(listener => listener(false));
  }

  static async deleteVideo(videoId: string): Promise<void> {
    console.log('SupabaseYouTubeService.deleteVideo called with videoId:', videoId);
    const tokenData = this.getStoredTokenData();
    if (!tokenData) {
      throw new Error('Not connected to YouTube');
    }

    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete video: ${errorText}`);
      }

      console.log('Successfully deleted video from YouTube');
    } catch (error) {
      console.error('Failed to delete video from YouTube:', error);
      throw error;
    }
  }

  static async uploadVideo(
    file: Blob, 
    title: string, 
    privacy: 'public' | 'private' | 'unlisted',
    onProgress?: (progress: any) => void
  ): Promise<{ videoId: string; videoUrl: string }> {
    const tokenData = this.getStoredTokenData();
    if (!tokenData) {
      throw new Error('Not connected to YouTube');
    }

    try {
      // Create metadata for the video
      const metadata = {
        snippet: {
          title: title,
          description: `Recorded with RecordLane`,
          tags: ['RecordLane', 'Screen Recording'],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: privacy,
        },
      };

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', JSON.stringify(metadata));
      formData.append('video', file);

      // Upload to YouTube
      const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      const videoId = result.id;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      console.log('Video uploaded successfully:', { videoId, videoUrl });
      return { videoId, videoUrl };
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  static async refreshAccessToken(): Promise<boolean> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.refresh_token) {
        return false;
      }

      const response = await fetch(`${this.getApiBase()}/auth/google/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokenData.refresh_token,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refresh token');
      }

      const newTokenData = await response.json();
      this.storeTokenData(newTokenData);
      return true;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return false;
    }
  }

  // Helper methods
  private static buildAuthUrlWithClientId(codeChallenge: string, state: string, clientId: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: OAUTH_CONFIG.scope,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private static async exchangeCodeForTokenViaBackend(code: string, codeVerifier: string): Promise<TokenData> {
    const response = await fetch(`${this.getApiBase()}/auth/google/exchange-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri: getRedirectUri(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange code for token');
    }

    return await response.json();
  }

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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static async openOAuthPopup(authUrl: string, state: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl,
        'google_oauth_popup',
        `width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height},scrollbars=${POPUP_CONFIG.scrollbars},resizable=${POPUP_CONFIG.resizable},centerscreen=${POPUP_CONFIG.centerscreen}`
      );

      if (!popup) {
        reject(new Error('Failed to open OAuth popup. Please allow popups and try again.'));
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('OAuth popup was closed'));
        }
      }, 1000);

      const checkUrl = setInterval(() => {
        try {
          const url = new URL(popup.location.href);
          if (url.pathname === '/auth/callback' || url.pathname.endsWith('/auth/callback')) {
            clearInterval(checkClosed);
            clearInterval(checkUrl);
            
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');
            const error = url.searchParams.get('error');

            if (error) {
              popup.close();
              reject(new Error(`OAuth error: ${error}`));
              return;
            }

            if (code && returnedState === state) {
              popup.close();
              resolve(code);
            } else {
              popup.close();
              reject(new Error('Invalid OAuth response'));
            }
          }
        } catch (e) {
          // Cross-origin error, popup is still on Google's domain
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        clearInterval(checkUrl);
        popup.close();
        reject(new Error('OAuth timeout'));
      }, POPUP_CONFIG.timeout);
    });
  }

  private static async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  private static getStoredTokenData(): TokenData | null {
    try {
      const stored = localStorage.getItem('youtube-tokens');
      if (!stored) return null;
      
      const tokenData = JSON.parse(stored);
      
      // Check if token is expired
      if (tokenData.expires_at && Date.now() > tokenData.expires_at) {
        this.clearTokens();
        return null;
      }
      
      return tokenData;
    } catch (error) {
      console.error('Failed to parse stored tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  private static storeTokenData(tokenData: TokenData): void {
    try {
      const expiresAt = Date.now() + (tokenData.expires_in * 1000);
      const dataToStore = {
        ...tokenData,
        expires_at: expiresAt,
      };
      
      localStorage.setItem('youtube-tokens', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  private static clearTokens(): void {
    localStorage.removeItem('youtube-tokens');
    sessionStorage.removeItem('youtube-code-verifier');
    sessionStorage.removeItem('youtube-state');
  }
}
