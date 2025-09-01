// Token management with client-side encryption for persistent auth

export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'loomclone-access-token';
  private static readonly REFRESH_TOKEN_KEY = 'loomclone-refresh-token';
  private static readonly TOKEN_EXPIRY_KEY = 'loomclone-token-expiry';
  private static readonly ENCRYPTION_KEY_NAME = 'loomclone-encryption-key';

  private static encryptionKey: CryptoKey | null = null;

  // Initialize or retrieve encryption key
  private static async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

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
  }

  // Encrypt data using Web Crypto API
  private static async encryptData(data: string): Promise<string> {
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
      throw new Error('Failed to decrypt stored data');
    }
  }

  // Store tokens securely
  static async storeTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Store access token with expiry (assume 1 hour)
      const expiryTime = Date.now() + (60 * 60 * 1000); // 1 hour from now
      
      await Promise.all([
        this.encryptData(accessToken).then(encrypted => 
          localStorage.setItem(this.ACCESS_TOKEN_KEY, encrypted)
        ),
        refreshToken ? this.encryptData(refreshToken).then(encrypted =>
          localStorage.setItem(this.REFRESH_TOKEN_KEY, encrypted)
        ) : Promise.resolve(),
      ]);

      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  // Get valid access token (refresh if needed)
  static async getValidAccessToken(): Promise<string | null> {
    try {
      const expiryTime = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      const now = Date.now();

      // Check if we have a valid access token
      if (expiryTime && parseInt(expiryTime) > now + (5 * 60 * 1000)) { // 5 min buffer
        const encryptedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        if (encryptedToken) {
          return await this.decryptData(encryptedToken);
        }
      }

      // Try to refresh the token
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
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
          client_id: 'your-google-client-id.apps.googleusercontent.com', // This should be from config
        }),
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
      await this.clearTokens();
      return null;
    }
  }

  // Clear all stored tokens
  static async clearTokens(): Promise<void> {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.ENCRYPTION_KEY_NAME);
    this.encryptionKey = null;
  }

  // Check if we have stored tokens
  static hasStoredTokens(): boolean {
    return !!(
      localStorage.getItem(this.ACCESS_TOKEN_KEY) && 
      localStorage.getItem(this.REFRESH_TOKEN_KEY)
    );
  }
}
