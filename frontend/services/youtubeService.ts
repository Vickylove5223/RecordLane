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
  TOKEN_CONFIG
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

  // Add connection status listener
  static addConnectionListener(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    
    return () => {
      const index = this.connectionListeners.indexOf(listener);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  // Notify connection status change
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
      // Check cache first (shorter duration for connection status)
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 60 * 1000) { // 1 minute cache
        return cached.data;
      }

      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result, 30 * 1000); // 30 second cache for negative results
        this.notifyConnectionChange(false);
        return result;
      }

      const userInfo = await this.getUserInfo(accessToken);
      
      const result = {
        isConnected: true,
        userEmail: userInfo.email,
      };

      await this.cache.set('connection-status', result, 5 * 60 * 1000); // 5 minute cache for positive results
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
      const accessToken = TokenService.getValidAccessToken();
      
      if (accessToken) {
        try {
          // Revoke the token
          await fetch(`https://oauth2.googleapis.com/revoke?token=${await accessToken}`, {
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

  // Enhanced API request method with automatic token refresh
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

    // If we get a 401, try to refresh token and retry once
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      
      accessToken = await TokenService.refreshAccessToken();
      
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }

      // Retry request with new token
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${accessToken}`,
      };

      response = await fetch(url, requestOptions);
      
      // If still 401 after refresh, token is invalid
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

      const authUrl = this.buildAuthUrl(codeChallenge, state);

      let authCode: string;
      try {
        authCode = await this.openOAuthPopup(authUrl, state);
      } catch (popupError) {
        if (this.isPopupBlockedError(popupError)) {
          console.warn('Popup blocked, trying redirect fallback');
          if (DEV_CONFIG.enableRedirectFallback) {
            authCode = await this.redirectOAuthFlow(authUrl);
          } else {
            throw ErrorHandler.createError('POPUP_BLOCKED', ERROR_MESSAGES.POPUP_BLOCKED, popupError);
          }
        } else {
          throw popupError;
        }
      }

      const tokenResponse = await this.exchangeCodeForToken(authCode, codeVerifier);
      
      // Store tokens using enhanced TokenService
      TokenService.storeTokens({
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type || 'Bearer',
        scope: tokenResponse.scope || YOUTUBE_SCOPES,
      });
      
      return tokenResponse;
    } catch (error) {
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_state');
      console.error('OAuth flow failed:', error);
      throw error;
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
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    });
    
    const url = `${AUTH_ENDPOINT}?${params.toString()}`;
    console.log('Generated auth URL:', url);
    return url;
  }

  private static async openOAuthPopup(authUrl: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        authUrl, 
        POPUP_CONFIG.windowName, 
        `width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height},scrollbars=${POPUP_CONFIG.scrollbars},resizable=${POPUP_CONFIG.resizable}`
      );
      
      if (!popup) {
        return reject(ErrorHandler.createError('POPUP_BLOCKED', ERROR_MESSAGES.POPUP_BLOCKED));
      }

      const timeout = setTimeout(() => {
        popup.close();
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
            // Cross-origin error, popup still on Google's domain
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
              resolve(code);
            } else {
              reject(ErrorHandler.createError('OAUTH_ERROR', 'No authorization code received'));
            }
          }
        } catch (error) {
          // Ignore cross-origin errors during polling
        }
      }, POPUP_CONFIG.pollInterval);
    });
  }

  private static async redirectOAuthFlow(authUrl: string): Promise<string> {
    sessionStorage.setItem('oauth_return_url', window.location.href);
    window.location.href = authUrl;
    return new Promise(() => {});
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const tokenData = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(),
    });
    
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      
      if (errorText.includes('redirect_uri_mismatch')) {
        throw ErrorHandler.createError('REDIRECT_URI_MISMATCH', ERROR_MESSAGES.REDIRECT_URI_MISMATCH);
      }
      
      throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }

  private static generateCodeVerifier = () => this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  private static generateCodeChallenge = async (v: string) => this.base64URLEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))));
  private static base64URLEncode = (a: Uint8Array) => btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  private static generateState = () => this.base64URLEncode(crypto.getRandomValues(new Uint8Array(16)));

  static handleOAuthCallback() {
    // Check if we're handling an OAuth callback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('OAuth callback detected:', { code: !!code, error, state });
        // The popup handling will take care of this
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
      throw new Error(`Failed to get user info: ${response.status}`);
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
      throw new Error(`Failed to initiate resumable upload: ${response.status}`);
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

  // Enhanced error detection methods
  private static isRetryableError = (e: any) => {
    // Network errors
    if (e?.name === 'TypeError' || e?.name === 'TimeoutError') return true;
    
    // Server errors
    if (e?.status >= 500 && e?.status < 600) return true;
    
    // Rate limiting
    if (e?.status === 429) return true;
    
    // Temporary auth issues (but not permanent ones)
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

  // Token refresh integration
  static async initialize(): Promise<void> {
    // Set up token refresh listener
    TokenService.addRefreshListener((success, token) => {
      if (!success) {
        console.log('Token refresh failed, clearing connection cache');
        this.cache.delete('connection-status');
        this.notifyConnectionChange(false);
      } else {
        console.log('Token refreshed successfully');
        // Optionally update cache with new connection status
        this.checkConnection().catch(error => {
          console.error('Failed to verify connection after token refresh:', error);
        });
      }
    });

    // Check initial connection
    this.checkConnection().catch(error => {
      console.error('Initial connection check failed:', error);
    });
  }
}

// Handle OAuth callback when the module loads
if (typeof window !== 'undefined') {
  YouTubeService.handleOAuthCallback();
  
  // Initialize the service
  YouTubeService.initialize().catch(error => {
    console.error('Failed to initialize YouTube service:', error);
  });
}
