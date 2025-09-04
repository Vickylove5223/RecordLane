import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { RetryService } from '../utils/retryService';
import { 
  UPLOAD_CONFIG, 
  ERROR_MESSAGES
} from '../config';

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

      // Check for stored tokens
      const accessToken = localStorage.getItem('recordlane-access-token');
      const userEmail = localStorage.getItem('recordlane-user-email');
      
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result, 30 * 1000);
        this.notifyConnectionChange(false);
        return result;
      }

      const result = {
        isConnected: true,
        userEmail: userEmail || 'demo@example.com',
      };

      await this.cache.set('connection-status', result, 5 * 60 * 1000);
      this.notifyConnectionChange(true);
      return result;
    } catch (error) {
      console.error('Failed to check YouTube connection:', error);
      ErrorHandler.logError('youtube-connection-check', error);
      
      const result = { isConnected: false, userEmail: null };
      await this.cache.set('connection-status', result, 30 * 1000);
      this.notifyConnectionChange(false);
      return result;
    }
  }

  static async connect(): Promise<{ userEmail: string }> {
    try {
      await this.cache.delete('connection-status');
      
      // Simulate OAuth flow for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockEmail = 'demo@example.com';
      localStorage.setItem('recordlane-access-token', 'demo-token-' + Date.now());
      localStorage.setItem('recordlane-user-email', mockEmail);
      
      await this.cache.set('connection-status', {
        isConnected: true,
        userEmail: mockEmail,
      }, 5 * 60 * 1000);
      
      this.notifyConnectionChange(true);
      return { userEmail: mockEmail };
    } catch (error) {
      console.error('Failed to connect to YouTube:', error);
      ErrorHandler.logError('youtube-connect', error);
      
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-user-email');
      await this.cache.delete('connection-status');
      this.notifyConnectionChange(false);
      
      throw ErrorHandler.createError('CONNECTION_FAILED', 'Failed to connect to YouTube', error);
    }
  }

  static async disconnect(): Promise<void> {
    try {
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-user-email');
      await this.cache.clear();
      this.notifyConnectionChange(false);
    } catch (error) {
      console.error('Failed to disconnect from YouTube:', error);
      ErrorHandler.logError('youtube-disconnect', error);
      localStorage.removeItem('recordlane-access-token');
      localStorage.removeItem('recordlane-user-email');
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
      const accessToken = localStorage.getItem('recordlane-access-token');
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      // Simulate upload progress
      const totalSteps = 20;
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const percentage = Math.round((i / totalSteps) * 100);
        onProgress?.({ 
          loaded: i * blob.size / totalSteps, 
          total: blob.size, 
          percentage 
        });
      }
      
      // Generate mock result
      const videoId = 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      return { videoId, videoUrl };
    } catch (error) {
      console.error('Failed to upload video:', error);
      ErrorHandler.logError('youtube-upload', error, { title, privacyStatus, fileSize: blob.size });
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
  }

  static async initialize(): Promise<void> {
    try {
      await this.checkConnection();
    } catch (error) {
      console.error('Failed to initialize YouTube service:', error);
    }
  }

  // Handle OAuth callback (simplified for demo)
  static handleOAuthCallback() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('OAuth callback detected:', { 
          hasCode: !!code, 
          error, 
          currentUrl: window.location.href,
        });
        
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
                state: urlParams.get('state')
              }, window.location.origin);
            }
            window.close();
          } catch (e) {
            console.error('Failed to communicate with parent window:', e);
          }
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  YouTubeService.handleOAuthCallback();
  
  YouTubeService.initialize().catch(error => {
    console.error('Failed to initialize YouTube service:', error);
  });
}
