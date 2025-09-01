import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { GOOGLE_CLIENT_ID } from '../config';

// Token management with client-side encryption for persistent auth

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'recordlane-access-token';
  private static readonly REFRESH_TOKEN_KEY = 'recordlane-refresh-token';
  private static readonly TOKEN_EXPIRY_KEY = 'recordlane-token-expiry';
  private static readonly ENCRYPTION_KEY_NAME = 'recordlane-encryption-key';

  private static encryptionKey: CryptoKey | null = null;
  private static cache = new CacheService('token-service');

  // Initialize or retrieve encryption key
  private static async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to load existing key
      const storedKey = localStorage.getItem(this.ENCRYPTION_KEY_NAME);
      if (storedKey) {
        try {
          const keyData = JSON.parse(storedKey);
          this.encryptionKey = await window.crypto.subtle.importKey(
            'jwk',
            keyData,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
          );
          return this.encryptionKey;
        } catch (error) {
          console.warn('Failed to load existing encryption key, generating new one');
          ErrorHandler.logError('encryption-key-load', error);
        }
      }

      // Generate new key
      this.encryptionKey = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );

      // Store key
      const exportedKey = await window.crypto.subtle.exportKey('jwk', this.encryptionKey);
      localStorage.setItem(this.ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

      return this.encryptionKey;
    } catch (error) {
      console.error('Failed to create encryption key:', error);
      ErrorHandler.logError('encryption-key-creation', error);
      throw ErrorHandler.createError('ENCRYPTION_FAILED', 'Failed to create encryption key');
    }
  }

  // Encrypt data using Web Crypto API
  private static async encryptData(data: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      ErrorHandler.logError('data-encryption', error);
      throw ErrorHandler.createError('ENCRYPTION_FAILED', 'Failed to encrypt data');
    }
  }

  // Decrypt data using Web Crypto API
  private static async decryptData(encryptedData: string): Promise<string> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      ErrorHandler.logError('data-decryption', error);
      throw ErrorHandler.createError('DECRYPTION_FAILED', 'Failed to decrypt stored data');
    }
  }

  // Store tokens securely
  static async storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Store access token with expiry (assume 1 hour)
      const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
      
      const encryptedAccessToken = await this.encryptData(accessToken);
      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccessToken);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

      if (refreshToken) {
        const encryptedRefreshToken = await this.encryptData(refreshToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
      }

      // Cache for quick access
      await this.cache.set('tokens', {
        accessToken,
        expiryTime,
        hasRefreshToken: !!refreshToken,
      });
    } catch (error) {
      console.error('Failed to store tokens:', error);
      ErrorHandler.logError('token-storage', error);
      throw ErrorHandler.createError('TOKEN_STORAGE_FAILED', 'Failed to store authentication tokens');
    }
  }

  // Get valid access token (refresh if needed)
  static async getValidAccessToken(): Promise<string | null> {
    try {
      // Check cache first
      const cached = await this.cache.get('tokens');
      if (cached && cached.data.expiryTime > Date.now() + (5 * 60 * 1000)) { // 5 min buffer
        return cached.data.accessToken;
      }

      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      const now = Date.now();

      // Check if we have a valid access token
      if (expiryTime && parseInt(expiryTime) > now + (5 * 60 * 1000)) { // 5 min buffer
        const encryptedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        if (encryptedToken) {
          const accessToken = await this.decryptData(encryptedToken);
          
          // Update cache
          await this.cache.set('tokens', {
            accessToken,
            expiryTime: parseInt(expiryTime),
            hasRefreshToken: !!localStorage.getItem(this.REFRESH_TOKEN_KEY),
          });
          
          return accessToken;
        }
      }

      // Try to refresh the token
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      ErrorHandler.logError('token-retrieval', error);
      return null;
    }
  }

  // Refresh access token using refresh token
  private static async refreshAccessToken(): Promise<string | null> {
    try {
      const encryptedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!encryptedRefreshToken) {
        return null;
      }

      const refreshToken = await this.decryptData(encryptedRefreshToken);
      
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: GOOGLE_CLIENT_ID,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        // Refresh token is invalid, clear stored tokens
        await this.clearTokens();
        return null;
      }

      const data = await response.json();
      
      // Store new access token (and new refresh token if provided)
      await this.storeTokens(data.access_token, data.refresh_token || refreshToken);
      
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      ErrorHandler.logError('token-refresh', error);
      await this.clearTokens();
      return null;
    }
  }

  // Clear all stored tokens
  static async clearTokens(): Promise<void> {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.ENCRYPTION_KEY_NAME);
      this.encryptionKey = null;
      
      await this.cache.delete('tokens');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      ErrorHandler.logError('token-clear', error);
    }
  }

  // Check if we have stored tokens
  static hasStoredTokens(): boolean {
    return !!(
      localStorage.getItem(this.ACCESS_TOKEN_KEY) && 
      localStorage.getItem(this.REFRESH_TOKEN_KEY)
    );
  }

  // Validate token format
  static isValidTokenFormat(token: string): boolean {
    // Basic validation for Google OAuth tokens
    return /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/.test(token) || 
           /^ya29\.[A-Za-z0-9\-_]+$/.test(token);
  }
}
