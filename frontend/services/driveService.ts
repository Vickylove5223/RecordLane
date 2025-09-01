import { TokenService } from './tokenService';

const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveConnection {
  isConnected: boolean;
  userEmail: string | null;
  folderName?: string;
}

export interface UploadResult {
  fileId: string;
  shareLink: string;
}

export class DriveService {
  private static folderId: string | null = null;

  static async checkConnection(): Promise<DriveConnection> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        return { isConnected: false, userEmail: null };
      }

      // Verify token by making a simple API call
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        await TokenService.clearTokens();
        return { isConnected: false, userEmail: null };
      }

      const userInfo = await response.json();
      const folderName = localStorage.getItem('loomclone-folder-name') || 'LoomClone Recordings';

      return {
        isConnected: true,
        userEmail: userInfo.email,
        folderName,
      };
    } catch (error) {
      console.error('Failed to check Drive connection:', error);
      return { isConnected: false, userEmail: null };
    }
  }

  static async connect(): Promise<{ userEmail: string; folderName: string }> {
    try {
      // Initialize Google API
      await this.loadGoogleAPI();
      
      // Start OAuth flow
      const authResult = await this.authorize();
      
      // Store tokens
      await TokenService.storeTokens(authResult.access_token, authResult.refresh_token);
      
      // Get user info
      const userInfo = await this.getUserInfo(authResult.access_token);
      
      // Create or find the recordings folder
      const folderName = await this.setupRecordingsFolder(authResult.access_token);
      
      localStorage.setItem('loomclone-folder-name', folderName);
      
      return {
        userEmail: userInfo.email,
        folderName,
      };
    } catch (error) {
      console.error('Failed to connect to Drive:', error);
      throw new Error('Failed to connect to Google Drive');
    }
  }

  static async disconnect(): Promise<void> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      
      if (accessToken) {
        // Revoke the token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
        });
      }
      
      await TokenService.clearTokens();
      localStorage.removeItem('loomclone-folder-name');
      localStorage.removeItem('loomclone-folder-id');
      this.folderId = null;
    } catch (error) {
      console.error('Failed to disconnect from Drive:', error);
      throw error;
    }
  }

  static async uploadFile(blob: Blob, title: string, privacy: string): Promise<UploadResult> {
    try {
      const accessToken = await TokenService.getValidAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token');
      }

      // Ensure we have a folder
      await this.ensureFolder(accessToken);

      // Create file metadata
      const metadata = {
        name: `${title}.webm`,
        parents: this.folderId ? [this.folderId] : undefined,
        mimeType: 'video/webm',
      };

      // Start resumable upload
      const uploadUrl = await this.initiateResumableUpload(metadata, blob.size, accessToken);
      
      // Upload the file
      const fileId = await this.uploadFileContent(uploadUrl, blob, accessToken);
      
      // Set permissions based on privacy setting
      await this.setFilePermissions(fileId, privacy, accessToken);
      
      // Generate share link
      const shareLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
      
      return { fileId, shareLink };
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file to Google Drive');
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
      script.onerror = reject;
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
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  private static async setupRecordingsFolder(accessToken: string): Promise<string> {
    const folderName = 'LoomClone Recordings';
    
    // Check if folder already exists
    const searchResponse = await fetch(
      `${DRIVE_API_BASE}/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search for existing folder');
    }

    const searchResult = await searchResponse.json();
    
    if (searchResult.files && searchResult.files.length > 0) {
      // Folder exists
      this.folderId = searchResult.files[0].id;
      localStorage.setItem('loomclone-folder-id', this.folderId);
      return folderName;
    }

    // Create new folder
    const createResponse = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create recordings folder');
    }

    const folder = await createResponse.json();
    this.folderId = folder.id;
    localStorage.setItem('loomclone-folder-id', this.folderId);
    
    return folderName;
  }

  private static async ensureFolder(accessToken: string): Promise<void> {
    if (!this.folderId) {
      const storedFolderId = localStorage.getItem('loomclone-folder-id');
      if (storedFolderId) {
        this.folderId = storedFolderId;
      } else {
        await this.setupRecordingsFolder(accessToken);
      }
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
    });

    if (!response.ok) {
      throw new Error('Failed to initiate resumable upload');
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
    accessToken: string
  ): Promise<string> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'video/webm',
      },
      body: blob,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file content');
    }

    const result = await response.json();
    return result.id;
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
