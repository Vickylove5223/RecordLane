import { supabase } from '../lib/supabase';

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface StoredToken {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  token_type: string;
  created_at: string;
  updated_at: string;
}

export class PersistentTokenService {
  private static readonly USER_ID_KEY = 'recordlane-user-id';
  private static readonly TOKEN_CACHE_KEY = 'recordlane-token-cache';

  // Get or create a unique user ID for this device
  private static getUserId(): string {
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  // Store tokens in both Supabase and local cache
  static async storeTokens(tokenData: TokenData): Promise<void> {
    const userId = this.getUserId();
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    try {
      // Store in Supabase
      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          scope: tokenData.scope,
          token_type: tokenData.token_type || 'Bearer',
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to store tokens in Supabase:', error);
        throw error;
      }

      // Also store in local cache for immediate access
      const cacheData = {
        ...tokenData,
        expires_at: expiresAt.toISOString(),
        user_id: userId,
      };
      localStorage.setItem(this.TOKEN_CACHE_KEY, JSON.stringify(cacheData));

      console.log('✅ Tokens stored successfully');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  // Get tokens from cache first, then Supabase
  static async getTokens(): Promise<TokenData | null> {
    try {
      // First try local cache
      const cached = localStorage.getItem(this.TOKEN_CACHE_KEY);
      if (cached) {
        const tokenData = JSON.parse(cached);
        const expiresAt = new Date(tokenData.expires_at);
        
        // Check if token is still valid (with 5 minute buffer)
        if (expiresAt.getTime() > Date.now() + (5 * 60 * 1000)) {
          return tokenData;
        }
      }

      // If cache is invalid or empty, try Supabase
      const userId = this.getUserId();
      const { data, error } = await supabase
        .from('user_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.log('No tokens found in Supabase');
        return null;
      }

      const expiresAt = new Date(data.expires_at);
      
      // Check if token is still valid
      if (expiresAt.getTime() > Date.now() + (5 * 60 * 1000)) {
        // Update local cache
        const tokenData = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
          scope: data.scope,
          token_type: data.token_type,
          expires_at: data.expires_at,
          user_id: data.user_id,
        };
        localStorage.setItem(this.TOKEN_CACHE_KEY, JSON.stringify(tokenData));
        
        return tokenData;
      } else {
        console.log('Stored tokens have expired');
        return null;
      }
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  // Clear tokens from both Supabase and local cache
  static async clearTokens(): Promise<void> {
    try {
      const userId = this.getUserId();
      
      // Clear from Supabase
      await supabase
        .from('user_tokens')
        .delete()
        .eq('user_id', userId);

      // Clear from local cache
      localStorage.removeItem(this.TOKEN_CACHE_KEY);
      
      console.log('✅ Tokens cleared successfully');
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      // Still clear local cache even if Supabase fails
      localStorage.removeItem(this.TOKEN_CACHE_KEY);
    }
  }

  // Check if user has valid tokens
  static async hasValidTokens(): Promise<boolean> {
    const tokens = await this.getTokens();
    return tokens !== null;
  }

  // Get user email from stored tokens (if available)
  static async getUserEmail(): Promise<string | null> {
    try {
      const tokens = await this.getTokens();
      if (!tokens) return null;

      // Try to get user info from Google API
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        return userInfo.email || null;
      }
    } catch (error) {
      console.error('Failed to get user email:', error);
    }
    return null;
  }
}
