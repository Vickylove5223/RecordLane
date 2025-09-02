import { ErrorHandler } from '../utils/errorHandler';
import { TOKEN_CONFIG, ERROR_MESSAGES } from '../config';

// Enhanced token management with automatic refresh

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface StoredTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope: string;
  issuedAt: number;
}

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'recordlane-access-token';
  private static readonly REFRESH_TOKEN_KEY = 'recordlane-refresh-token';
  private static readonly TOKEN_DATA_KEY = 'recordlane-token-data';
  private static readonly USER_INFO_KEY = 'recordlane-user-info';
  
  private static refreshPromise: Promise<string | null> | null = null;
  private static refreshListeners: Array<(success: boolean, token?: string) => void> = [];

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
      };

      // Store individual tokens for backward compatibility
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refresh_token);
      }
      
      // Store complete token data
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
      
      // Validate token data structure
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
        return null;
      }

      const now = Date.now();
      const timeUntilExpiry = tokenData.expiresAt - now;

      // If token is not expired, return it
      if (timeUntilExpiry > TOKEN_CONFIG.refreshThreshold) {
        return tokenData.accessToken;
      }

      // Token is expired or close to expiry - attempt refresh
      console.log('Token expired or near expiry, attempting refresh...', {
        timeUntilExpiry,
        threshold: TOKEN_CONFIG.refreshThreshold,
        hasRefreshToken: !!tokenData.refreshToken,
      });

      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      ErrorHandler.logError('token-get-valid', error);
      return null;
    }
  }

  // Refresh access token using refresh token
  static async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      console.log('Refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  private static async performTokenRefresh(): Promise<string | null> {
    try {
      const tokenData = this.getStoredTokenData();
      if (!tokenData?.refreshToken) {
        console.log('No refresh token available, user needs to re-authenticate');
        this.clearTokens();
        this.notifyRefreshListeners(false);
        return null;
      }

      console.log('Attempting to refresh access token...');

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: tokenData.scope.includes('youtube') ? 
            '104046752889-schirpg4cp1ckr4i587dmc97qhlkmjnt.apps.googleusercontent.com' : 
            tokenData.accessToken.substring(0, 10), // Fallback
          refresh_token: tokenData.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', response.status, errorText);
        
        if (response.status === 400) {
          // Invalid refresh token, user needs to re-authenticate
          console.log('Refresh token is invalid, clearing tokens');
          this.clearTokens();
          this.notifyRefreshListeners(false);
          throw ErrorHandler.createError('TOKEN_REFRESH_FAILED', ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
        }
        
        throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
      }

      const refreshData = await response.json();
      
      // Create new token data
      const newTokenData: TokenData = {
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || tokenData.refreshToken, // Keep old refresh token if new one not provided
        expires_in: refreshData.expires_in || 3600,
        token_type: refreshData.token_type || 'Bearer',
        scope: refreshData.scope || tokenData.scope,
      };

      // Store the new tokens
      this.storeTokens(newTokenData);
      
      console.log('Token refresh successful');
      this.notifyRefreshListeners(true, newTokenData.access_token);
      
      return newTokenData.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
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
  static isTokenNearExpiry(thresholdMs = TOKEN_CONFIG.refreshThreshold): boolean {
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

  // Validate token format (basic validation)
  static isValidTokenFormat(token: string): boolean {
    // Google OAuth2 access tokens are typically 39+ characters and alphanumeric with some special chars
    return typeof token === 'string' && token.length >= 39 && /^[A-Za-z0-9\-_.~]+$/.test(token);
  }

  // Get token expiry info
  static getTokenExpiry(): { expiresAt: number; expiresIn: number; isNearExpiry: boolean; isExpired: boolean } | null {
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

  // Force refresh token (for testing or manual refresh)
  static async forceRefresh(): Promise<string | null> {
    console.log('Forcing token refresh...');
    this.refreshPromise = null; // Clear any existing refresh promise
    return this.refreshAccessToken();
  }

  // Get token for API calls with automatic refresh
  static async getTokenForRequest(): Promise<string | null> {
    const token = await this.getValidAccessToken();
    
    if (!token) {
      console.log('No valid token available for API request');
      return null;
    }

    return token;
  }

  // Initialize token monitoring
  static initializeMonitoring(): void {
    if (typeof window === 'undefined' || !TOKEN_CONFIG.autoRefreshEnabled) {
      return;
    }

    // Check token status every minute
    setInterval(() => {
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return;

      const now = Date.now();
      const timeUntilExpiry = tokenData.expiresAt - now;

      // If token will expire soon and we have a refresh token, proactively refresh
      if (timeUntilExpiry <= TOKEN_CONFIG.refreshThreshold && timeUntilExpiry > 0) {
        console.log('Proactively refreshing token before expiry');
        this.refreshAccessToken().catch(error => {
          console.error('Proactive token refresh failed:', error);
        });
      }
    }, 60 * 1000); // Check every minute

    // Monitor page visibility to refresh token when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isTokenNearExpiry()) {
        console.log('Page became visible, checking token status');
        this.getValidAccessToken().catch(error => {
          console.error('Token validation on visibility change failed:', error);
        });
      }
    });
  }
}

// Initialize monitoring when the module loads
if (typeof window !== 'undefined') {
  TokenService.initializeMonitoring();
}
