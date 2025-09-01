import { TokenService } from './tokenService';
import { ErrorHandler } from '../utils/errorHandler';
import { CacheService } from '../utils/cacheService';
import { RetryService } from '../utils/retryService';
import { GOOGLE_CLIENT_ID, UPLOAD_CONFIG, ERROR_MESSAGES } from '../config';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveConnection {
  isConnected: boolean;
  userEmail: string | null;
  folderName?: string;
  folderId?: string;
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

  static async checkConnection(): Promise<DriveConnection> {
    try {
      // Check cache first
      const cached = await this.cache.get('connection-status');
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        return cached.data;
      }

      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result);
        return result;
      }

      // Verify token by making a simple API call with retry
      const response = await this.retryService.execute(
        () => fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        }),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => error.name === 'TypeError' || error.name === 'TimeoutError'
        }
      );

      if (!response.ok) {
        await TokenService.clearTokens();
        const result = { isConnected: false, userEmail: null };
        await this.cache.set('connection-status', result);
        return result;
      }

      const userInfo = await response.json();
      const storedFolderId = localStorage.getItem('recordlane-selected-folder-id');
      const storedFolderName = localStorage.getItem('recordlane-selected-folder-name');

      if (storedFolderId && storedFolderName) {
        this.selectedFolderId = storedFolderId;
        this.selectedFolderName = storedFolderName;
      }

      const result = {
        isConnected: true,
        userEmail: userInfo.email,
        folderName: this.selectedFolderName || undefined,
        folderId: this.selectedFolderId || undefined,
      };

      await this.cache.set('connection-status', result);
      return result;
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      ErrorHandler.logError('drive-connection-check', error);
      
      const result = { isConnected: false, userEmail: null };
      await this.cache.set('connection-status', result);
      return result;
    }
  }

  static async connect(): Promise<{ userEmail: string; requiresFolderSetup: boolean }> {
    try {
      // Clear any cached connection status
      await this.cache.delete('connection-status');
      
      // Initialize Google API with retry
      await this.retryService.execute(
        () => this.loadGoogleAPI(),
        {
          maxRetries: 3,
          retryDelay: 2000,
          shouldRetry: () => true
        }
      );
      
      // Start OAuth flow
      const authResult = await this.authorize();
      
      // Store tokens
      await TokenService.storeTokens(authResult.access_token, authResult.refresh_token);
      
      // Get user info with retry
      const userInfo = await this.retryService.execute(
        () => this.getUserInfo(authResult.access_token),
        {
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => error.message.includes('network') || error.message.includes('timeout')
        }
      );
      
      // Check if user already has a selected folder
      const storedFolderId = localStorage.getItem('recordlane-selected-folder-id');
      const storedFolderName = localStorage.getItem('recordlane-selected-folder-name');
      
      let requiresFolderSetup = true;
      
      if (storedFolderId && storedFolderName) {
        // Verify the folder still exists
        try {
          await this.verifyFolder(storedFolderId, authResult.access_token);
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
      });
      
      return {
        userEmail: userInfo.email,
        requiresFolderSetup,
      };
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      ErrorHandler.logError('drive-connect', error);
      
      // Clear any partial state
      await TokenService.clearTokens();
      await this.cache.delete('connection-status');
      
      throw ErrorHandler.createError('CONNECTION_FAILED', 'Failed to connect to Google Drive', error);
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      
      if (accessToken) {
        // Revoke the token with retry
        await this.retryService.execute(
          () => fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST',
            signal: AbortSignal.timeout(10000),
          }),
          {
            maxRetries: 2,
            retryDelay: 1000,
            shouldRetry: () => true
          }
        );
      }
      
      await TokenService.clearTokens();
      await this.cache.clear();
      
      localStorage.removeItem('recordlane-selected-folder-id');
      localStorage.removeItem('recordlane-selected-folder-name');
      this.selectedFolderId = null;
      this.selectedFolderName = null;
    } catch (error) {
      console.error('Failed to disconnect from Drive:', error);
      ErrorHandler.logError('drive-disconnect', error);
      
      // Even if revocation fails, clear local state
      await TokenService.clearTokens();
      await this.cache.clear();
      
      throw error;
    }
  }

  static async listFolders(): Promise<DriveFolder[]> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        throw ErrorHandler.createError('AUTH_REQUIRED', ERROR_MESSAGES.DRIVE_NOT_CONNECTED);
      }

      const response = await this.retryService.execute(
        () => fetch(
          `${DRIVE_API_BASE}/files?q=mimeType='application/vnd.google-apps.folder' and trashed=false&orderBy=name&fields=files(id,name,createdTime,webViewLink)`,
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
          shouldRetry: (error) => error.name === 'TypeError' || error.status >= 500
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list folders: ${response.status}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Failed to list folders:', error);
      ErrorHandler.logError('drive-list-folders', error);
      throw ErrorHandler.createError('FOLDER_LIST_FAILED', 'Failed to list Google Drive folders', error);
    }
  }

  static async createFolder(name: string): Promise<DriveFolder> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
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
          shouldRetry: (error) => error.name === 'TypeError' || error.status >= 500
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.status}`);
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
      throw ErrorHandler.createError('FOLDER_CREATE_FAILED', 'Failed to create folder in Google Drive', error);
    }
  }

  static async selectFolder(folderId: string, folderName: string): Promise<void> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
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
        await this.cache.set('connection-status', cached.data);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
      ErrorHandler.logError('drive-select-folder', error, { folderId, folderName });
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
    return null;
  }

  static async uploadFile(
    blob: Blob, 
    title: string, 
    privacy: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
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

      // Start resumable upload with retry
      const uploadUrl = await this.retryService.execute(
        () => this.initiateResumableUpload(metadata, blob.size, accessToken),
        {
          maxRetries: UPLOAD_CONFIG.maxRetries,
          retryDelay: UPLOAD_CONFIG.retryDelayMs,
          shouldRetry: (error) => error.message.includes('network') || error.status >= 500
        }
      );
      
      // Upload the file with progress tracking
      const fileId = await this.uploadFileContent(uploadUrl, blob, accessToken, onProgress);
      
      // Set permissions based on privacy setting with retry
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
      
      if (error.name === 'QuotaExceededError') {
        throw ErrorHandler.createError('QUOTA_EXCEEDED', ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      }
      
      throw ErrorHandler.createError('UPLOAD_FAILED', ERROR_MESSAGES.UPLOAD_FAILED, error);
    }
  }

  private static async verifyFolder(folderId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${DRIVE_API_BASE}/files/${folderId}?fields=id,name,trashed`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Folder verification failed: ${response.status}`);
    }

    const folder = await response.json();
    if (folder.trashed) {
      throw new Error('Folder is in trash');
    }
  }

  private static async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
          }).then(resolve, reject);
        });
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  private static async authorize(): Promise<any> {
    const authInstance = window.gapi.auth2.getAuthInstance();
    const authResult = await authInstance.signIn({
      scope: DRIVE_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });
    
    const authResponse = authResult.getAuthResponse(true);
    return authResponse;
  }

  private static async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return response.json();
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
}

// Extend window type for Google API
declare global {
  interface Window {
    gapi: any;
  }
}
