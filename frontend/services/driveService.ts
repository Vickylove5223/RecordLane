import { TokenService } from './tokenService';
import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { RetryService } from '../utils/retryService';
import { GOOGLE_CLIENT_ID, UPLOAD_CONFIG, ERROR_MESSAGES, OAUTH_CONFIG } from '../config';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveConnection {
  isConnected: boolean;
  userEmail: string | null;
  folderName?: string;
  folderId?: string;
  requiresFolderSetup?: boolean;
}

export interface DriveFolder {
  id: string;
  name: string;
  createdTime: string;
  webViewLink: string;
}

export interface UploadResult {
  fileId: string;
  shareLink: string;
  webViewLink: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class DriveService {
  private static selectedFolderId: string | null = null;
  private static selectedFolderName: string | null = null;
  private static cache = new CacheService('drive-service');
  private static retryService = new RetryService();
  private static isGapiLoaded = false;
  private static gapiLoadPromise: Promise<void> | null = null;

  static async checkConnection(): Promise<DriveConnection> {
    try {
      // Check cache first (short cache time for connection status)
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
        return cached.data;
      }

      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null, requiresFolderSetup: false };
        await this.cache.set('connection-status', result, 2 * 60 * 1000); // 2 minutes
        return result;
      }

      // Verify token by getting user info
      const userInfo = await this.getUserInfo(accessToken);
      
      // Check folder setup
      const storedFolderId = localStorage.getItem('recordlane-selected-folder-id');
      const storedFolderName = localStorage.getItem('recordlane-selected-folder-name');

      let requiresFolderSetup = true;

      if (storedFolderId && storedFolderName) {
        try {
          // Verify the folder still exists
          await this.verifyFolder(storedFolderId, accessToken);
          this.selectedFolderId = storedFolderId;
          this.selectedFolderName = storedFolderName;
          requiresFolderSetup = false;
        } catch (error) {
          // Folder doesn't exist anymore, need to setup again
          localStorage.removeItem('recordlane-selected-folder-id');
          localStorage.removeItem('recordlane-selected-folder-name');
          this.selectedFolderId = null;
          this.selectedFolderName = null;
        }
      }

      const result = {
        isConnected: true,
        userEmail: userInfo.email,
        folderName: this.selectedFolderName || undefined,
        folderId: this.selectedFolderId || undefined,
        requiresFolderSetup,
      };

      await this.cache.set('connection-status', result, 2 * 60 * 1000); // 2 minutes
      return result;
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      ErrorHandler.logError('drive-connection-check', error);
      
      // If token is invalid, clear it
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
      }
      
      const result = { isConnected: false, userEmail: null, requiresFolderSetup: false };
      await this.cache.set('connection-status', result, 30 * 1000); // 30 seconds for error state
      return result;
    }
  }

  static async connect(): Promise<{ userEmail: string; requiresFolderSetup: boolean }> {
    try {
      // Clear any cached connection status
      await this.cache.delete('connection-status');
      
      // Start OAuth flow
      const authResult = await this.startOAuthFlow();
      
      // Parse the token from the result
      const accessToken = authResult.access_token;
      const expiresIn = parseInt(authResult.expires_in) || 3600;
      
      if (!accessToken) {
        throw new Error('No access token received from OAuth');
      }

      // Store tokens
      TokenService.storeTokens(accessToken, expiresIn);
      
      // Get user info
      const userInfo = await this.getUserInfo(accessToken);
      TokenService.storeUserInfo(userInfo);
      
      // Check if user already has a selected folder
      const storedFolderId = localStorage.getItem('recordlane-selected-folder-id');
      const storedFolderName = localStorage.getItem('recordlane-selected-folder-name');
      
      let requiresFolderSetup = true;
      
      if (storedFolderId && storedFolderName) {
        try {
          await this.verifyFolder(storedFolderId, accessToken);
          this.selectedFolderId = storedFolderId;
          this.selectedFolderName = storedFolderName;
          requiresFolderSetup = false;
        } catch (error) {
          // Folder doesn't exist anymore, need to setup again
          localStorage.removeItem('recordlane-selected-folder-id');
          localStorage.removeItem('recordlane-selected-folder-name');
        }
      }
      
      // Cache the successful connection
      await this.cache.set('connection-status', {
        isConnected: true,
        userEmail: userInfo.email,
        folderName: this.selectedFolderName,
        folderId: this.selectedFolderId,
        requiresFolderSetup,
      }, 5 * 60 * 1000); // 5 minutes
      
      return {
        userEmail: userInfo.email,
        requiresFolderSetup,
      };
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      ErrorHandler.logError('drive-connect', error);
      
      // Clear any partial state
      TokenService.clearTokens();
      await this.cache.delete('connection-status');
      
      if (this.isUserCancelledError(error)) {
        throw ErrorHandler.createError('USER_CANCELLED', 'Authentication was cancelled');
      } else if (this.isAuthError(error)) {
        throw ErrorHandler.createError('AUTH_FAILED', ERROR_MESSAGES.AUTH_FAILED, error);
      }
      
      throw ErrorHandler.createError('CONNECTION_FAILED', 'Failed to connect to Google Drive', error);
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const accessToken = TokenService.getValidAccessToken();
      
      if (accessToken) {
        // Revoke the token
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
        } catch (revokeError) {
          console.warn('Failed to revoke token:', revokeError);
          // Continue with local cleanup even if revocation fails
        }
      }
      
      TokenService.clearTokens();
      await this.cache.clear();
      
      localStorage.removeItem('recordlane-selected-folder-id');
      localStorage.removeItem('recordlane-selected-folder-name');
      this.selectedFolderId = null;
      this.selectedFolderName = null;
    } catch (error) {
      console.error('Failed to disconnect from Drive:', error);
      ErrorHandler.logError('drive-disconnect', error);
      
      // Even if disconnect fails, clear local state
      TokenService.clearTokens();
      await this.cache.clear();
      
      throw error;
    }
  }

  static async listFolders(): Promise<DriveFolder[]> {
    try {
      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      const response = await this.retryService.execute(
        () => fetch(
          `${DRIVE_API_BASE}/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false&orderBy=name&fields=files(id,name,createdTime,webViewLink)&pageSize=100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            signal: AbortSignal.timeout(15000),
          }
        ),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => this.isRetryableError(error)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          TokenService.clearTokens();
          throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
        }
        throw new Error(`Failed to list folders: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Failed to list folders:', error);
      ErrorHandler.logError('drive-list-folders', error);
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      throw ErrorHandler.createError('FOLDER_LIST_FAILED', 'Failed to list Google Drive folders', error);
    }
  }

  static async createFolder(name: string): Promise<DriveFolder> {
    try {
      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      const response = await this.retryService.execute(
        () => fetch(`${DRIVE_API_BASE}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.folder',
          }),
          signal: AbortSignal.timeout(15000),
        }),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => this.isRetryableError(error)
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          TokenService.clearTokens();
          throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
        }
        throw new Error(`Failed to create folder: ${response.status} ${response.statusText}`);
      }

      const folder = await response.json();
      return {
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime || new Date().toISOString(),
        webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      };
    } catch (error) {
      console.error('Failed to create folder:', error);
      ErrorHandler.logError('drive-create-folder', error, { name });
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      throw ErrorHandler.createError('FOLDER_CREATE_FAILED', 'Failed to create folder in Google Drive', error);
    }
  }

  static async selectFolder(folderId: string, folderName: string): Promise<void> {
    try {
      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      // Verify the folder exists and is accessible
      await this.verifyFolder(folderId, accessToken);

      // Store the selection
      this.selectedFolderId = folderId;
      this.selectedFolderName = folderName;
      
      localStorage.setItem('recordlane-selected-folder-id', folderId);
      localStorage.setItem('recordlane-selected-folder-name', folderName);

      // Update cache
      const cached = await this.cache.get('connection-status');
      if (cached) {
        cached.data.folderId = folderId;
        cached.data.folderName = folderName;
        cached.data.requiresFolderSetup = false;
        await this.cache.set('connection-status', cached.data, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      ErrorHandler.logError('drive-select-folder', error, { folderId, folderName });
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      throw ErrorHandler.createError('FOLDER_SELECT_FAILED', 'Failed to select folder', error);
    }
  }

  static getSelectedFolder(): { id: string; name: string } | null {
    if (this.selectedFolderId && this.selectedFolderName) {
      return {
        id: this.selectedFolderId,
        name: this.selectedFolderName,
      };
    }

    // Try to load from localStorage if not in memory
    const storedFolderId = localStorage.getItem('recordlane-selected-folder-id');
    const storedFolderName = localStorage.getItem('recordlane-selected-folder-name');
    
    if (storedFolderId && storedFolderName) {
      this.selectedFolderId = storedFolderId;
      this.selectedFolderName = storedFolderName;
      return {
        id: storedFolderId,
        name: storedFolderName,
      };
    }

    return null;
  }

  static async uploadFile(
    blob: Blob, 
    title: string, 
    privacy: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const accessToken = TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      if (!this.selectedFolderId) {
        throw ErrorHandler.createError('NO_FOLDER_SELECTED', 'No folder selected for uploads');
      }

      // Validate file size (100MB limit)
      if (blob.size > 100 * 1024 * 1024) {
        throw ErrorHandler.createError('FILE_TOO_LARGE', ERROR_MESSAGES.FILE_TOO_LARGE);
      }

      // Create file metadata
      const metadata = {
        name: `${title}.webm`,
        parents: [this.selectedFolderId],
        mimeType: 'video/webm',
      };

      // Start resumable upload
      const uploadUrl = await this.retryService.execute(
        () => this.initiateResumableUpload(metadata, blob.size, accessToken),
        {
          maxRetries: UPLOAD_CONFIG.maxRetries,
          retryDelay: UPLOAD_CONFIG.retryDelayMs,
          shouldRetry: (error) => this.isRetryableError(error)
        }
      );
      
      // Upload the file with progress tracking
      const fileId = await this.uploadFileContent(uploadUrl, blob, accessToken, onProgress);
      
      // Set permissions based on privacy setting
      await this.retryService.execute(
        () => this.setFilePermissions(fileId, privacy, accessToken),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: () => true
        }
      );
      
      // Generate share links
      const shareLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      const webViewLink = `https://drive.google.com/file/d/${fileId}/preview`;
      
      return { fileId, shareLink, webViewLink };
    } catch (error) {
      console.error('Failed to upload file:', error);
      ErrorHandler.logError('drive-upload', error, { title, privacy, fileSize: blob.size });
      
      if (this.isAuthError(error)) {
        TokenService.clearTokens();
        throw ErrorHandler.createError('AUTH_EXPIRED', ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      
      if (error.name === 'QuotaExceededError') {
        throw ErrorHandler.createError('QUOTA_EXCEEDED', ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      }
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
  }

  // Private helper methods

  private static async startOAuthFlow(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: window.location.origin,
        response_type: 'token',
        scope: DRIVE_SCOPE,
        include_granted_scopes: 'true',
        state: Math.random().toString(36).substring(2, 15),
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      // Open popup window
      const popup = window.open(
        authUrl,
        'google_oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Failed to open OAuth popup. Please allow popups for this site.'));
        return;
      }

      // Poll for completion
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            reject(new Error('OAuth popup was closed'));
            return;
          }

          // Check if we can access the popup URL (same origin)
          let popupUrl;
          try {
            popupUrl = popup.location.href;
          } catch (e) {
            // Still on different origin, continue polling
            return;
          }

          // Check if we're back to our origin with a fragment
          if (popupUrl.includes(window.location.origin) && popupUrl.includes('#')) {
            clearInterval(pollTimer);
            popup.close();

            // Parse the fragment
            const fragment = popupUrl.split('#')[1];
            const params = new URLSearchParams(fragment);
            
            const accessToken = params.get('access_token');
            const error = params.get('error');
            
            if (error) {
              reject(new Error(`OAuth error: ${error}`));
            } else if (accessToken) {
              resolve({
                access_token: accessToken,
                expires_in: params.get('expires_in') || '3600',
                token_type: params.get('token_type') || 'Bearer',
              });
            } else {
              reject(new Error('No access token received'));
            }
          }
        } catch (error) {
          // Continue polling
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth timeout'));
      }, 5 * 60 * 1000);
    });
  }

  private static async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return response.json();
  }

  private static async verifyFolder(folderId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_BASE}/files/${folderId}?fields=id,name,trashed`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Folder not found');
      }
      if (response.status === 401) {
        throw new Error('Authentication expired');
      }
      throw new Error(`Folder verification failed: ${response.status}`);
    }

    const folder = await response.json();
    if (folder.trashed) {
      throw new Error('Folder is in trash');
    }
  }

  private static async initiateResumableUpload(
    metadata: any,
    fileSize: number,
    accessToken: string
  ): Promise<string> {
    const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=resumable`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/webm',
        'X-Upload-Content-Length': fileSize.toString(),
      },
      body: JSON.stringify(metadata),
      signal: AbortSignal.timeout(UPLOAD_CONFIG.timeoutMs),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired');
      }
      throw new Error(`Failed to initiate resumable upload: ${response.status}`);
    }

    const uploadUrl = response.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL returned');
    }

    return uploadUrl;
  }

  private static async uploadFileContent(
    uploadUrl: string,
    blob: Blob,
    accessToken: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100)
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result.id);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else if (xhr.status === 401) {
          reject(new Error('Authentication expired'));
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('Content-Type', 'video/webm');
      xhr.timeout = UPLOAD_CONFIG.timeoutMs;
      
      xhr.send(blob);
    });
  }

  private static async setFilePermissions(
    fileId: string,
    privacy: string,
    accessToken: string
  ): Promise<void> {
    if (privacy === 'private') {
      return; // No additional permissions needed
    }

    const role = privacy === 'anyone-commenter' ? 'commenter' : 'reader';
    
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        type: 'anyone',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn('Failed to set file permissions, but upload succeeded');
    }
  }

  // Error handling helpers

  private static isRetryableError(error: any): boolean {
    return (
      error?.name === 'TypeError' || 
      error?.name === 'TimeoutError' ||
      (error?.status >= 500 && error?.status < 600) ||
      error?.status === 429 || // Rate limit
      error?.message?.includes('network') ||
      error?.message?.includes('timeout')
    );
  }

  private static isAuthError(error: any): boolean {
    return (
      error?.status === 401 ||
      error?.message?.includes('Authentication expired') ||
      error?.message?.includes('invalid_token') ||
      error?.message?.includes('Unauthorized')
    );
  }

  private static isUserCancelledError(error: any): boolean {
    return (
      error?.message?.includes('popup was closed') ||
      error?.message?.includes('access_denied') ||
      error?.message?.includes('cancelled')
    );
  }
}
