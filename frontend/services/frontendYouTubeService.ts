import { ErrorHandler } from '../utils/errorHandler';
import { RetryService } from '../utils/retryService';
import { 
  UPLOAD_CONFIG, 
  ERROR_MESSAGES,
  OAUTH_CONFIG,
  getRedirectUri,
  POPUP_CONFIG,
  isYouTubeConfigured
} from '../config';

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

export class FrontendYouTubeService {
  private static cache = new Map<string, any>();
  private static retryService = new RetryService();
  private static connectionListeners: Array<(connected: boolean) => void> = [];

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
      if (!isYouTubeConfigured()) {
        return { isConnected: false, userEmail: null };
      }

      const tokenData = this.getStoredTokenData();
      if (!tokenData) {
        return { isConnected: false, userEmail: null };
      }

      // Validate token
      const isValid = await this.validateToken(tokenData.access_token);
      if (!isValid) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (!refreshed) {
          this.clearTokens();
          return { isConnected: false, userEmail: null };
        }
      }

      const userInfo = await this.getUserInfo(tokenData.access_token);
      return { isConnected: true, userEmail: userInfo.email };
    } catch (error) {
      console.error('Connection check failed:', error);
      return { isConnected: false, userEmail: null };
    }
  }

  static async connect(): Promise<{ userEmail: string }> {
    if (!isYouTubeConfigured()) {
      throw new Error('YouTube is not configured. Please set up your Google API credentials.');
    }

    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      // Store code verifier for later use
      sessionStorage.setItem('youtube-code-verifier', codeVerifier);
      sessionStorage.setItem('youtube-state', state);

      const authUrl = this.buildAuthUrl(codeChallenge, state);
      const code = await this.openOAuthPopup(authUrl, state);
      
      const tokenData = await this.exchangeCodeForToken(code, codeVerifier);
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
      // Step 1: Initialize upload
      const initResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title,
            description: `Uploaded from RecordLane - ${new Date().toISOString()}`,
            tags: ['RecordLane', 'Screen Recording'],
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: privacy,
            selfDeclaredMadeForKids: false,
          },
        }),
      });

      if (!initResponse.ok) {
        throw new Error(`Upload initialization failed: ${initResponse.statusText}`);
      }

      const location = initResponse.headers.get('Location');
      if (!location) {
        throw new Error('No upload location received');
      }

      // Step 2: Upload file
      const uploadResponse = await fetch(location, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/*',
          'Content-Length': file.size.toString(),
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      return {
        videoId: result.id,
        videoUrl: `https://www.youtube.com/watch?v=${result.id}`,
      };
    } catch (error) {
      console.error('Video upload failed:', error);
      throw error;
    }
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
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static buildAuthUrl(codeChallenge: string, state: string): string {
    if (!OAUTH_CONFIG.clientId) {
      throw new Error('YouTube is not configured. Please set up your Google API credentials.');
    }

    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: OAUTH_CONFIG.scope,
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
        return reject(new Error('Popup blocked. Please allow popups and try again.'));
      }

      // Listen for messages from the popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }
        
        if (event.data.type === 'oauth_success') {
          clearTimeout(timeout);
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.state !== expectedState) {
            return reject(new Error('Invalid state parameter'));
          }
          
          resolve(event.data.code);
        } else if (event.data.type === 'oauth_error') {
          clearTimeout(timeout);
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.error === 'access_denied') {
            return reject(new Error('User denied access'));
          }
          
          reject(new Error(`OAuth error: ${event.data.error}`));
        }
      };

      window.addEventListener('message', messageHandler);

      const timeout = setTimeout(() => {
        popup.close();
        window.removeEventListener('message', messageHandler);
        reject(new Error('OAuth timeout - please try again'));
      }, POPUP_CONFIG.timeout);

      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            reject(new Error('OAuth popup was closed'));
          }
        } catch (error) {
          // This should not happen, but handle gracefully
          console.log('Error checking popup status:', error);
        }
      }, POPUP_CONFIG.pollInterval);
    });
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenData> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: OAUTH_CONFIG.clientId,
          client_secret: OAUTH_CONFIG.clientSecret,
          code: code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: getRedirectUri(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  }

  private static async refreshAccessToken(): Promise<boolean> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.refresh_token) {
        return false;
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          client_id: OAUTH_CONFIG.clientId,
          client_secret: OAUTH_CONFIG.clientSecret,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return false;
      }

      const newTokenData = await response.json();
      this.storeTokenData({
        ...tokenData,
        ...newTokenData,
        refresh_token: tokenData.refresh_token, // Keep existing refresh token
      });

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
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

  private static async getUserInfo(accessToken: string): Promise<UserInfo> {
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

      return await response.json();
    } catch (error) {
      console.error('Get user info failed:', error);
      throw error;
    }
  }

  private static getStoredTokenData(): TokenData | null {
    try {
      const stored = localStorage.getItem('recordlane-youtube-tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return null;
    }
  }

  private static storeTokenData(tokenData: TokenData): void {
    try {
      localStorage.setItem('recordlane-youtube-tokens', JSON.stringify(tokenData));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  private static clearTokens(): void {
    try {
      localStorage.removeItem('recordlane-youtube-tokens');
      sessionStorage.removeItem('youtube-code-verifier');
      sessionStorage.removeItem('youtube-state');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }
}
