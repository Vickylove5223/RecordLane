// Configuration for the RecordLane application

// Google OAuth Configuration
// TODO: Replace with your Google OAuth client ID from Google Cloud Console
export const GOOGLE_CLIENT_ID = 'your-google-client-id.apps.googleusercontent.com';

// Google Drive API Configuration
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Application Configuration
export const APP_CONFIG = {
  name: 'RecordLane',
  version: '1.0.0',
  description: 'Privacy-first screen recording with Google Drive sync',
  url: 'https://recordlane.com',
  supportEmail: 'support@recordlane.com',
};

// Recording Defaults
export const DEFAULT_RECORDING_SETTINGS = {
  resolution: '720p' as const,
  frameRate: 30 as const,
  highlightClicks: true,
  privacy: 'anyone-viewer' as const,
  folderName: 'RecordLane Recordings',
};

// Upload Configuration
export const UPLOAD_CONFIG = {
  chunkSize: 8 * 1024 * 1024, // 8MB chunks for resumable uploads
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  maxCacheSize: 50 * 1024 * 1024, // 50MB cache limit
  cacheExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
  lazyLoadThreshold: 100, // pixels
  debounceMs: 300,
};

// UI Configuration
export const UI_CONFIG = {
  floatingButtonPosition: {
    bottom: 32,
    left: 32,
  },
  animationDuration: 300,
  toastDuration: 5000,
};

// Feature Flags
export const FEATURES = {
  trimming: true, // Enable client-side trimming
  drawing: true,  // Enable drawing overlays
  clickHighlights: true, // Enable click highlighting
  pip: true, // Enable picture-in-picture camera
  offlineMode: false, // Offline recording (future feature)
  analytics: false, // Usage analytics (privacy-respecting)
};

// Error Messages
export const ERROR_MESSAGES = {
  DRIVE_NOT_CONNECTED: 'Please connect Google Drive before recording',
  PERMISSIONS_DENIED: 'Camera or screen sharing permissions denied',
  UPLOAD_FAILED: 'Failed to upload recording to Google Drive',
  RECORDING_FAILED: 'Failed to start recording',
  NETWORK_ERROR: 'Network connection error. Please check your internet.',
  STORAGE_QUOTA_EXCEEDED: 'Google Drive storage quota exceeded',
  BROWSER_NOT_SUPPORTED: 'Your browser does not support screen recording',
  FILE_TOO_LARGE: 'Recording file is too large to upload',
};

// Cache Configuration
export const CACHE_CONFIG = {
  storageKey: 'recordlane-cache',
  version: '1.0',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

// Development Configuration
export const DEV_CONFIG = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  mockAPI: false,
  skipOnboarding: false,
};
