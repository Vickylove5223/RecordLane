import backend from '~backend/client';
import { ErrorHandler } from '../utils/errorHandler';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface StoredTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope: string;
  issuedAt: number;
  idToken?: string;
}

export interface TokenExpiryInfo {
  expiresAt: number;
  expiresIn: number;
  isNearExpiry: boolean;
  isExpired: boolean;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'recordlane-access-token';
  private static readonly REFRESH_TOKEN_KEY = 'recordlane-refresh-token';
  private static readonly TOKEN_DATA_KEY = 'recordlane-token-data';
  private static readonly USER_INFO_KEY = 'recordlane-user-info';
  
  private static refreshListeners: Array<(success: boolean, token?: string) => void> = [];
  private static isRefreshing = false;
  private static refreshPromise: Promise<string | null> | null = null;

  // Store tokens with enhanced metadata
  static storeTokens(tokenData: TokenData): void {
    try {
      const now = Date.now();
      const expiresAt = now + (tokenData.expires_in * 1000);
      
      const storedData: StoredTokenData = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || '',
        issuedAt: now,
        idToken: tokenData.id_token,
      };

      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refresh_token);
      }
      
      localStorage.setItem(this.TOKEN_DATA_KEY, JSON.stringify(storedData));
      
      console.log('Tokens stored successfully:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        expiresAt: new Date(expiresAt).toISOString(),
      });
      
    } catch (error) {
      console.error('Failed to store tokens:', error);
      ErrorHandler.logError('token-storage', error);
      throw ErrorHandler.createError('TOKEN_STORAGE_FAILED', 'Failed to store authentication tokens');
    }
  }

  // Get stored token data
  static getStoredTokenData(): StoredTokenData | null {
    try {
      const tokenDataStr = localStorage.getItem(this.TOKEN_DATA_KEY);
      if (!tokenDataStr) {
        return null;
      }

      const tokenData: StoredTokenData = JSON.parse(tokenDataStr);
      
      if (!tokenData.accessToken || !tokenData.expiresAt) {
        console.warn('Invalid token data structure, clearing tokens');
        this.clearTokens();
        return null;
      }

      return tokenData;
    } catch (error) {
      console.error('Failed to parse stored token data:', error);
      this.clearTokens();
      return null;
    }
  }

  // Get valid access token with automatic refresh
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData) {
        console.debug('No stored token data found');
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired()) {
        console.log('Token is expired, attempting refresh');
        return await this.refreshAccessToken();
      }

      // Check if token is near expiry and refresh proactively
      if (this.isTokenNearExpiry(5 * 60 * 1000)) { // 5 minutes
        console.log('Token is near expiry, proactively refreshing');
        // Don't await this refresh, return current token
        this.refreshAccessToken().catch(error => {
          console.warn('Proactive token refresh failed:', error);
        });
      }

      return tokenData.accessToken;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      ErrorHandler.logError('token-get-valid', error);
      return null;
    }
  }

  // Refresh access token with deduplication
  static async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      return await this.refreshPromise;
    }

    this.isRefreshing = true;
    
    this.refreshPromise = this._performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private static async _performTokenRefresh(): Promise<string | null> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.refreshToken) {
        console.log('No refresh token available');
        this.clearTokens();
        this.notifyRefreshListeners(false);
        return null;
      }

      console.log('Refreshing access token...');
      
      const response = await backend.auth.refreshToken({
        refreshToken: tokenData.refreshToken,
      });
      
      // Store the new tokens
      this.storeTokens({
        access_token: response.access_token,
        refresh_token: tokenData.refreshToken, // Keep existing refresh token
        expires_in: response.expires_in,
        token_type: response.token_type,
        scope: response.scope,
        id_token: response.id_token,
      });
      
      console.log('Token refresh successful');
      this.notifyRefreshListeners(true, response.access_token);
      
      return response.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      ErrorHandler.logError('token-refresh', error);
      
      // Clear tokens on refresh failure
      this.clearTokens();
      this.notifyRefreshListeners(false);
      
      return null;
    }
  }

  // Add refresh listener
  static addRefreshListener(listener: (success: boolean, token?: string) => void): () => void {
    this.refreshListeners.push(listener);
    
    return () => {
      const index = this.refreshListeners.indexOf(listener);
      if (index > -1) {
        this.refreshListeners.splice(index, 1);
      }
    };
  }

  // Notify refresh listeners
  private static notifyRefreshListeners(success: boolean, token?: string): void {
    this.refreshListeners.forEach(listener => {
      try {
        listener(success, token);
      } catch (error) {
        console.error('Error in refresh listener:', error);
      }
    });
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

  // Check if token is close to expiring
  static isTokenNearExpiry(thresholdMs = 5 * 60 * 1000): boolean {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return true;

      const now = Date.now();
      const timeUntilExpiry = tokenData.expiresAt - now;
      
      return timeUntilExpiry <= thresholdMs;
    } catch (error) {
      return true;
    }
  }

  // Check if token is expired
  static isTokenExpired(): boolean {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return true;

      return Date.now() >= tokenData.expiresAt;
    } catch (error) {
      return true;
    }
  }

  // Clear all stored tokens and user info
  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_DATA_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
      
      console.log('All tokens cleared');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      ErrorHandler.logError('token-clear', error);
    }
  }

  // Check if we have stored tokens
  static hasStoredTokens(): boolean {
    const tokenData = this.getStoredTokenData();
    return !!tokenData?.accessToken;
  }

  // Get token expiry info
  static getTokenExpiry(): TokenExpiryInfo | null {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return null;

      const now = Date.now();
      const expiresAt = tokenData.expiresAt;
      const expiresIn = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const isNearExpiry = this.isTokenNearExpiry();
      const isExpired = this.isTokenExpired();

      return { expiresAt, expiresIn, isNearExpiry, isExpired };
    } catch (error) {
      return null;
    }
  }

  // Get token for API calls
  static async getTokenForRequest(): Promise<string | null> {
    return this.getValidAccessToken();
  }

  // Cleanup resources
  static cleanup(): void {
    this.refreshListeners = [];
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
}
