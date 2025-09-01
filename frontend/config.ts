// Configuration for the LoomClone application

// Google OAuth Configuration
// TODO: Replace with your Google OAuth client ID from Google Cloud Console
export const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';

// Google Drive API Configuration
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Recording Defaults
export const DEFAULT_RECORDING_SETTINGS = {
  resolution: '720p' as const,
  frameRate: 30 as const,
  highlightClicks: true,
  privacy: 'anyone-viewer' as const,
};

// Upload Configuration
export const UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks for resumable uploads
export const MAX_UPLOAD_RETRIES = 3;

// UI Configuration
export const FLOATING_BUTTON_POSITION = {
  bottom: 32,
  left: 32,
};

// Feature Flags
export const FEATURES = {
  trimming: true, // Enable client-side trimming
  drawing: true,  // Enable drawing overlays
  clickHighlights: true, // Enable click highlighting
  pip: true, // Enable picture-in-picture camera
};

// Error Messages
export const ERROR_MESSAGES = {
  DRIVE_NOT_CONNECTED: 'Please connect Google Drive before recording',
  PERMISSIONS_DENIED: 'Camera or screen sharing permissions denied',
  UPLOAD_FAILED: 'Failed to upload recording to Google Drive',
  RECORDING_FAILED: 'Failed to start recording',
};
