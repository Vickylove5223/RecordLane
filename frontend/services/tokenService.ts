import { ErrorHandler } from '../utils/errorHandler';
import { GOOGLE_CLIENT_ID } from '../config';

// Simplified token management for client-side Google OAuth

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'recordlane-access-token';
  private static readonly TOKEN_EXPIRY_KEY = 'recordlane-token-expiry';
  private static readonly USER_INFO_KEY = 'recordlane-user-info';

  // Store tokens securely (simplified for client-side)
  static storeTokens(accessToken: string, expiresIn: number = 3600): void {
    try {
      const expiryTime = Date.now() + (expiresIn * 1000);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
      ErrorHandler.logError('token-storage', error);
      throw ErrorHandler.createError('TOKEN_STORAGE_FAILED', 'Failed to store authentication tokens');
    }
  }

  // Store user info
  static storeUserInfo(userInfo: any): void {
    try {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to store user info:', error);
      ErrorHandler.logError('user-info-storage', error);
    }
  }

  // Get stored user info
  static getUserInfo(): any | null {
    try {
      const userInfo = localStorage.getItem(this.USER_INFO_KEY);
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  // Get valid access token
  static getValidAccessToken(): string | null {
    try {
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      if (!accessToken || !expiryTime) {
        return null;
      }

      const now = Date.now();
      const expiry = parseInt(expiryTime);

      // Check if token is expired (with 5 minute buffer)
      if (now >= expiry - (5 * 60 * 1000)) {
        this.clearTokens();
        return null;
      }

      return accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      ErrorHandler.logError('token-retrieval', error);
      return null;
    }
  }

  // Check if token is close to expiring (within 10 minutes)
  static isTokenNearExpiry(): boolean {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return true;

      const now = Date.now();
      const expiry = parseInt(expiryTime);
      
      return now >= expiry - (10 * 60 * 1000); // 10 minutes buffer
    } catch (error) {
      return true;
    }
  }

  // Clear all stored tokens and user info
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      ErrorHandler.logError('token-clear', error);
    }
  }

  // Check if we have stored tokens
  static hasStoredTokens(): boolean {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return !!(accessToken && expiryTime);
  }

  // Validate token format (basic validation)
  static isValidTokenFormat(token: string): boolean {
    // Google OAuth2 access tokens are typically 39+ characters and alphanumeric with some special chars
    return typeof token === 'string' && token.length >= 39 && /^[A-Za-z0-9\-_.~]+$/.test(token);
  }

  // Get token expiry info
  static getTokenExpiry(): { expiresAt: number; expiresIn: number } | null {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryTime) return null;

      const expiresAt = parseInt(expiryTime);
      const expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));

      return { expiresAt, expiresIn };
    } catch (error) {
      return null;
    }
  }

  // Refresh token by re-authenticating (for client-side OAuth)
  static async refreshToken(): Promise<string | null> {
    try {
      // For client-side OAuth, we need to re-authenticate
      // This would typically trigger the OAuth flow again
      console.log('Token refresh needed - re-authentication required');
      this.clearTokens();
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      ErrorHandler.logError('token-refresh', error);
      this.clearTokens();
      return null;
    }
  }
}
