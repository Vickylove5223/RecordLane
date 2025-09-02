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
  YOUTUBE_SCOPES
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

  static async checkConnection(): Promise<YouTubeConnection> {
    try {
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
        return cached.data;
      }

      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result, 2 * 60 * 1000);
        return result;
      }

      const userInfo = await this.getUserInfo(accessToken);
      
      const result = {
        isConnected: true,
        userEmail: userInfo.email,
      };

      await this.cache.set('connection-status', result, 2 * 60 * 1000);
      return result;
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
      }
      
      const result = { isConnected: false, userEmail: null };
      await this.cache.set('connection-status', result, 30 * 1000);
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
      
      return { userEmail: userInfo.email };
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      TokenService.clearTokens();
      await this.cache.delete('connection-status');
      
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
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
      ErrorHandler.logError('youtube-disconnect', error);
      TokenService.clearTokens();
      await this.cache.clear();
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
      const accessToken = TokenService.getValidAccessToken();
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
          shouldRetry: (error) => this.isRetryableError(error)
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
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
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
      TokenService.storeTokens(tokenResponse.access_token, tokenResponse.expires_in);
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
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline', // To get a refresh token
      prompt: 'consent',
      include_granted_scopes: 'true',
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  private static async openOAuthPopup(authUrl: string, expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const popup = window.open(authUrl, POPUP_CONFIG.windowName, `width=${POPUP_CONFIG.width},height=${POPUP_CONFIG.height}`);
      if (!popup) {
        return reject(ErrorHandler.createError('POPUP_BLOCKED', ERROR_MESSAGES.POPUP_BLOCKED));
      }

      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            return reject(ErrorHandler.createError('POPUP_CLOSED', ERROR_MESSAGES.POPUP_CLOSED));
          }
          const url = new URL(popup.location.href);
          if (url.origin === window.location.origin) {
            clearInterval(pollTimer);
            popup.close();
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            if (state !== expectedState) reject(ErrorHandler.createError('INVALID_STATE', ERROR_MESSAGES.INVALID_STATE));
            else if (code) resolve(code);
            else reject(ErrorHandler.createError('OAUTH_ERROR', 'No authorization code received'));
          }
        } catch (error) { /* ignore cross-origin errors */ }
      }, POPUP_CONFIG.pollInterval);
    });
  }

  private static async redirectOAuthFlow(authUrl: string): Promise<string> {
    sessionStorage.setItem('oauth_return_url', window.location.href);
    window.location.href = authUrl;
    return new Promise(() => {});
  }

  private static async exchangeCodeForToken(code: string, codeVerifier: string): Promise<{ access_token: string; expires_in: number }> {
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
    if (!response.ok) throw new Error('Failed to exchange code for token');
    return response.json();
  }

  private static generateCodeVerifier = () => this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  private static generateCodeChallenge = async (v: string) => this.base64URLEncode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))));
  private static base64URLEncode = (a: Uint8Array) => btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  private static generateState = () => this.base64URLEncode(crypto.getRandomValues(new Uint8Array(16)));

  static handleOAuthCallback() { /* Logic moved to connect() for simplicity in this flow */ }

  private static async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to get user info');
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
    if (!response.ok) throw new Error('Failed to initiate resumable upload');
    return response.headers.get('Location')!;
  }

  private static async uploadFileContent(uploadUrl: string, blob: Blob, onProgress?: (p: UploadProgress) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => onProgress?.({ loaded: e.loaded, total: e.total, percentage: Math.round((e.loaded / e.total) * 100) });
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(JSON.parse(xhr.responseText).id) : reject(new Error(`Upload failed: ${xhr.statusText}`));
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.open('PUT', uploadUrl);
      xhr.send(blob);
    });
  }

  private static isRetryableError = (e: any) => e?.name === 'TypeError' || e?.name === 'TimeoutError' || (e?.status >= 500 && e?.status < 600) || e?.status === 429;
  private static isAuthError = (e: any) => e?.status === 401 || e?.message?.includes('Authentication expired');
  private static isUserCancelledError = (e: any) => e?.code === 'POPUP_CLOSED' || e?.message?.includes('access_denied');
  private static isPopupBlockedError = (e: any) => e?.code === 'POPUP_BLOCKED';
  private static isRedirectUriMismatchError = (e: any) => e?.message?.includes('redirect_uri_mismatch');
}

if (typeof window !== 'undefined') {
  YouTubeService.handleOAuthCallback();
}
