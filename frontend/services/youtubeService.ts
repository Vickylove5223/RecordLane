import { TokenService } from './tokenService';
import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { RetryService } from '../utils/retryService';
import { 
  GOOGLE_CLIENT_ID, 
  UPLOAD_CONFIG, 
  ERROR_MESSAGES, 
  getRedirectUri, 
  OAUTH_CONFIG, 
  POPUP_CONFIG,
  DEV_CONFIG,
  YOUTUBE_SCOPES,
  TOKEN_CONFIG,
  PKCE_CONFIG
} from '../config';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_API_BASE = 'https://www.googleapis.com/upload/youtube/v3';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

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

export class YouTubeService {
  private static cache = new CacheService('youtube-service');
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
    try {
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 60 * 1000) {
        return cached.data;
      }

      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result, 30 * 1000);
        this.notifyConnectionChange(false);
        return result;
      }

      const userInfo = await this.getUserInfo(accessToken);
      
      const result = {
        isConnected: true,
        userEmail: userInfo.email,
      };

      await this.cache.set('connection-status', result, 5 * 60 * 1000);
      this.notifyConnectionChange(true);
      return result;
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        this.notifyConnectionChange(false);
      }
      
      const result = { isConnected: false, userEmail: null };
      await this.cache.set('connection-status', result, 30 * 1000);
      this.notifyConnectionChange(false);
      return result;
    }
  }

  static async connect(): Promise<{ userEmail: string }> {
    try {
      await this.cache.delete('connection-status');
      
      const authResult = await this.startOAuthFlow();
      
      const userInfo = await this.getUserInfo(authResult.access_token);
      TokenService.storeUserInfo(userInfo);
      
      await this.cache.set('connection-status', {
        isConnected: true,
        userEmail: userInfo.email,
      }, 5 * 60 * 1000);
      
      this.notifyConnectionChange(true);
      return { userEmail: userInfo.email };
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      TokenService.clearTokens();
      await this.cache.delete('connection-status');
      this.notifyConnectionChange(false);
      
      if (this.isUserCancelledError(error)) {
        throw ErrorHandler.createError('USER_CANCELLED', 'Authentication was cancelled');
      } else if (this.isAuthError(error)) {
        throw ErrorHandler.createError('AUTH_FAILED', ERROR_MESSAGES.AUTH_FAILED, error);
      } else if (this.isPopupBlockedError(error)) {
        throw ErrorHandler.createError('POPUP_BLOCKED', ERROR_MESSAGES.POPUP_BLOCKED, error);
      } else if (this.isRedirectUriMismatchError(error)) {
        throw ErrorHandler.createError('REDIRECT_URI_MISMATCH', ERROR_MESSAGES.REDIRECT_URI_MISMATCH, error);
      }
      
      throw ErrorHandler.createError('CONNECTION_FAILED', 'Failed to connect to YouTube', error);
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      
      if (accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        } catch (revokeError) {
          console.warn('Failed to revoke token:', revokeError);
        }
      }
      
      TokenService.clearTokens();
      await this.cache.clear();
      this.notifyConnectionChange(false);
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
      ErrorHandler.logError('youtube-disconnect', error);
      TokenService.clearTokens();
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
    try {
      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      const metadata = {
        snippet: {
          title,
          description: `Recorded with RecordLane on ${new Date().toLocaleString()}`,
        },
        status: {
          privacyStatus,
        },
      };

      const uploadUrl = await this.retryService.execute(
        () => this.initiateResumableUpload(metadata, blob.size, accessToken),
        {
          maxRetries: UPLOAD_CONFIG.maxRetries,
          retryDelay: UPLOAD_CONFIG.retryDelayMs,
          shouldRetry: (error) => this.isRetryableError(error),
          onRetry: (error, attempt) => {
            console.log(`Retrying upload initiation (attempt ${attempt}):`, error.message);
          }
        }
      );
      
      const videoId = await this.uploadFileContent(uploadUrl, blob, onProgress);
      
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      return { videoId, videoUrl };
    } catch (error) {
      console.error('Failed to upload video:', error);
      ErrorHandler.logError('youtube-upload', error, { title, privacyStatus, fileSize: blob.size });
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        this.notifyConnectionChange(false);
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
  }

  private static async makeAuthenticatedRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = await TokenService.getValidAccessToken();
    
    if (!accessToken) {
      throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    };

    let response = await fetch(url, requestOptions);

    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      
      accessToken = await TokenService.refreshAccessToken();
      
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }

      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${accessToken}`,
      };

      response = await fetch(url, requestOptions);
      
      if (response.status === 401) {
        TokenService.clearTokens();
        this.notifyConnectionChange(false);
        throw ErrorHandler.createError('AUTH_TOKEN_INVALID', ERROR_MESSAGES.AUTH_TOKEN_INVALID);
      }
    }

    return response;
  }

  private static async startOAuthFlow(): Promise<{ access_token: string; expires_in: number }> {
    try {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      const state = this.generateState();

      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_redirect_uri', getRedirectUri());

      const authUrl = this.buildAuthUrl(codeChallenge, state);

      let authCode: string;

      console.log('Starting OAuth flow with PKCE...');
      authCode = await this.openOAuthPopup(authUrl, state);

      console.log('Authorization code received, exchanging for tokens...');
      const tokenResponse = await this.exchangeCodeForToken(authCode, codeVerifier);
      
      TokenService.storeTokens({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope || YOUTUBE_SCOPES,
        id_token: tokenResponse.id_token,
      });
      
      return tokenResponse;
    } catch (error) {
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_redirect_uri');
      console.error('OAuth flow failed:', error);
      throw error;
    } finally {
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_redirect_uri');
    }
  }

  private static buildAuthUrl(codeChallenge: string, state: string): string {
    const redirectUri = getRedirectUri();
    console.log('Building auth URL with redirect URI:', redirectUri);
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: PKCE_CONFIG.codeChallengeMethod,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });
    
    const url = `${AUTH_ENDPOINT}?${params.toString()}`;
    console.log('Generated auth URL (without sensitive params):', url.replace(/code_challenge=[^&]*/, 'code_challenge=REDACTED'));
    return url;
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
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          clearTimeout(timeout);
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.state !== expectedState) {
            return reject(ErrorHandler.createError('INVALID_STATE', ERROR_MESSAGES.INVALID_STATE));
          }
          
          console.log('Authorization code received via message');
          resolve(event.data.code);
        } else if (event.data.type === 'OAUTH_ERROR') {
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
            return reject(ErrorHandler.createError('POPUP_CLOSED', ERROR_MESSAGES.POPUP_CLOSED));
          }

          let currentUrl;
          try {
            currentUrl = popup.location.href;
          } catch (e) {
            return;
          }

          const url = new URL(currentUrl);
          const redirectUri = getRedirectUri();
          
          if (url.origin === new URL(redirectUri).origin) {
            clearInterval(pollTimer);
            clearTimeout(timeout);
            popup.close();
            
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            const error = url.searchParams.get('error');
            
            if (error) {
              if (error === 'access_denied') {
                return reject(ErrorHandler.createError('USER_CANCELLED', 'User denied access'));
              }
              return reject(ErrorHandler.createError('OAUTH_ERROR', `OAuth error: ${error}`));
            }
            
            if (state !== expectedState) {
              return reject(ErrorHandler.createError('INVALID_STATE', ERROR_MESSAGES.INVALID_STATE));
            }
            
            if (code) {
              console.log('Authorization code received successfully');
              resolve(code);
            } else {
              reject(ErrorHandler.createError('OAUTH_ERROR', 'No authorization code received'));
            }
          }
        } catch (error) {
          if (error.name !== 'SecurityError') {
            console.warn('Unexpected error during popup polling:', error);
          }
        }
      }, POPUP_CONFIG.pollInterval);
    });
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const redirectUri = getRedirectUri();
    
    const tokenData = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });
    
    console.log('Exchanging authorization code for tokens...', {
      redirectUri,
      hasCode: !!code,
      hasCodeVerifier: !!codeVerifier,
    });
    
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: 'unknown_error', error_description: errorText };
      }
      
      if (errorData.error === 'redirect_uri_mismatch') {
        throw ErrorHandler.createError('REDIRECT_URI_MISMATCH', ERROR_MESSAGES.REDIRECT_URI_MISMATCH);
      }
      
      if (errorData.error === 'invalid_grant') {
        throw ErrorHandler.createError('INVALID_GRANT', ERROR_MESSAGES.INVALID_GRANT);
      }
      
      throw new Error(`Token exchange failed: ${response.status} ${errorData.error_description || errorData.error}`);
    }
    
    const tokenResponse = await response.json();
    console.log('Token exchange successful:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
    });
    
    return tokenResponse;
  }

  private static generateCodeVerifier(): string {
    const array = new Uint8Array(PKCE_CONFIG.codeVerifierLength / 2);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  private static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  private static base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static generateState(): string {
    const array = new Uint8Array(PKCE_CONFIG.stateLength);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  static handleOAuthCallback() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('OAuth callback detected:', { 
          hasCode: !!code, 
          error, 
          state,
          currentUrl: window.location.href,
        });
        
        // If we're in a popup, communicate with the parent window
        if (window.opener && window.opener !== window) {
          try {
            if (error) {
              window.opener.postMessage({
                type: 'OAUTH_ERROR',
                error: error,
                errorDescription: urlParams.get('error_description')
              }, window.location.origin);
            } else if (code) {
              window.opener.postMessage({
                type: 'OAUTH_SUCCESS',
                code: code,
                state: state
              }, window.location.origin);
            }
            window.close();
          } catch (e) {
            console.error('Failed to communicate with parent window:', e);
          }
        } else {
          // If we're not in a popup, handle the callback directly
          if (error) {
            console.error('OAuth error:', error);
            // You could redirect to an error page or show an error message
          } else if (code) {
            console.log('OAuth code received:', code);
            // You could process the code directly here if needed
          }
        }
      }
    }
  }

  private static async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      const errorText = await response.text();
      throw new Error(`Failed to get user info: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }

  private static async initiateResumableUpload(metadata: any, fileSize: number, accessToken: string): Promise<string> {
    const response = await fetch(`${YOUTUBE_UPLOAD_API_BASE}/videos?uploadType=resumable&part=snippet,status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
        'X-Upload-Content-Length': fileSize.toString(),
      },
      body: JSON.stringify(metadata),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      const errorText = await response.text();
      throw new Error(`Failed to initiate resumable upload: ${response.status} ${errorText}`);
    }
    
    const location = response.headers.get('Location');
    if (!location) {
      throw new Error('No upload URL received from YouTube API');
    }
    
    return location;
  }

  private static async uploadFileContent(uploadUrl: string, blob: Blob, onProgress?: (p: UploadProgress) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({ 
            loaded: e.loaded, 
            total: e.total, 
            percentage: Math.round((e.loaded / e.total) * 100) 
          });
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.id);
          } catch (parseError) {
            reject(new Error('Failed to parse upload response'));
          }
        } else if (xhr.status === 401) {
          reject(ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED));
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      
      xhr.open('PUT', uploadUrl);
      xhr.timeout = UPLOAD_CONFIG.timeoutMs;
      xhr.send(blob);
    });
  }

  private static isRetryableError = (e: any) => {
    if (e?.name === 'TypeError' || e?.name === 'TimeoutError') return true;
    if (e?.status >= 500 && e?.status < 600) return true;
    if (e?.status === 429) return true;
    if (e?.status === 502 || e?.status === 503 || e?.status === 504) return true;
    return false;
  };

  private static isAuthError = (e: any) => {
    return e?.status === 401 || 
           e?.code === 'AUTH_EXPIRED' ||
           e?.code === 'AUTH_TOKEN_INVALID' ||
           e?.message?.includes('Authentication expired') || 
           e?.message?.includes('invalid_grant') ||
           e?.message?.includes('invalid_token');
  };

  private static isUserCancelledError = (e: any) => {
    return e?.code === 'POPUP_CLOSED' || 
           e?.code === 'USER_CANCELLED' || 
           e?.message?.includes('access_denied') ||
           e?.message?.includes('cancelled');
  };

  private static isPopupBlockedError = (e: any) => {
    return e?.code === 'POPUP_BLOCKED' || 
           e?.message?.includes('popup') ||
           e?.message?.includes('blocked');
  };

  private static isRedirectUriMismatchError = (e: any) => {
    return e?.message?.includes('redirect_uri_mismatch') || 
           e?.error === 'redirect_uri_mismatch' ||
           e?.code === 'REDIRECT_URI_MISMATCH';
  };

  static async initialize(): Promise<void> {
    TokenService.addRefreshListener((success, token) => {
      if (!success) {
        console.log('Token refresh failed, clearing connection cache');
        this.cache.delete('connection-status');
        this.notifyConnectionChange(false);
      } else {
        console.log('Token refreshed successfully');
        this.checkConnection().catch(error => {
          console.error('Failed to verify connection after token refresh:', error);
        });
      }
    });

    this.checkConnection().catch(error => {
      console.error('Initial connection check failed:', error);
    });
  }
}

if (typeof window !== 'undefined') {
  YouTubeService.handleOAuthCallback();
  
  YouTubeService.initialize().catch(error => {
    console.error('Failed to initialize YouTube service:', error);
  });
}
