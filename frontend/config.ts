// Configuration for the RecordLane application

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '104046752889-schirpg4cp1ckr4i587dmc97qhlkmjnt.apps.googleusercontent.com';

// YouTube API Configuration
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

// OAuth Configuration with PKCE
export const OAUTH_CONFIG = {
  clientId: GOOGLE_CLIENT_ID,
  scope: YOUTUBE_SCOPES,
  responseType: 'code',
  accessType: 'offline',
  prompt: 'consent',
  includeGrantedScopes: true,
  codeChallenge: '',
  codeChallengeMethod: 'S256',
  state: '',
};

// Environment-specific configuration - FIXED
export const getRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    return 'https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev';
  }
  
  const origin = window.location.origin;
  
  // For Leap development environment
  if (origin.includes('loom-clone-d2qv2u482vjq7vcc59sg.lp.dev')) {
    return 'https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev';
  }
  
  // Development URLs
  if (origin.includes('.lp.dev')) {
    return origin;
  }
  
  // Local development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin;
  }
  
  // Production fallback
  return 'https://recordlane.com';
};

// Popup configuration for OAuth
export const POPUP_CONFIG = {
  width: 500,
  height: 600,
  scrollbars: 'yes',
  resizable: 'yes',
  centerscreen: 'yes',
  windowName: 'google_oauth',
  pollInterval: 1000,
  timeout: 5 * 60 * 1000,
};

// Application Configuration
export const APP_CONFIG = {
  name: 'RecordLane',
  version: '1.0.0',
  description: 'Privacy-first screen recording with YouTube sync',
  url: 'https://recordlane.com',
  supportEmail: 'support@recordlane.com',
};

// Recording Defaults
export const DEFAULT_RECORDING_SETTINGS = {
  resolution: '720p' as const,
  frameRate: 30 as const,
  highlightClicks: true,
  privacy: 'unlisted' as const,
  folderName: 'RecordLane Recordings',
};

// Upload Configuration
export const UPLOAD_CONFIG = {
  chunkSize: 8 * 1024 * 1024,
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 30000,
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  maxCacheSize: 50 * 1024 * 1024,
  cacheExpirationMs: 24 * 60 * 60 * 1000,
  lazyLoadThreshold: 100,
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
  trimming: true,
  drawing: true,
  clickHighlights: true,
  pip: true,
  offlineMode: false,
  analytics: true,
};

// Error Messages
export const ERROR_MESSAGES = {
  DRIVE_NOT_CONNECTED: 'Please connect your YouTube account before recording',
  PERMISSIONS_DENIED: 'Camera or screen sharing permissions denied',
  UPLOAD_FAILED: 'Failed to upload recording to YouTube',
  RECORDING_FAILED: 'Failed to start recording',
  NETWORK_ERROR: 'Network connection error. Please check your internet.',
  STORAGE_QUOTA_EXCEEDED: 'YouTube storage quota exceeded',
  BROWSER_NOT_SUPPORTED: 'Your browser does not support screen recording',
  FILE_TOO_LARGE: 'Recording file is too large to upload',
  AUTH_FAILED: 'YouTube authentication failed',
  TOKEN_EXPIRED: 'Authentication session expired, please sign in again',
  ACCESS_DENIED: 'Access to YouTube was denied',
  POPUP_BLOCKED: 'Authentication popup was blocked. Please allow popups and try again.',
  OAUTH_ERROR: 'Authentication failed. Please try again.',
  CONNECTION_TIMEOUT: 'Connection timeout. Please check your internet connection.',
  REDIRECT_URI_MISMATCH: 'OAuth configuration error. Please contact support.',
  POPUP_TIMEOUT: 'Authentication window timed out. Please try again.',
  POPUP_CLOSED: 'Authentication window was closed. Please try again.',
  INVALID_STATE: 'Invalid authentication state. Please try again.',
  CODE_EXCHANGE_FAILED: 'Failed to exchange authorization code. Please try again.',
};

// Cache Configuration
export const CACHE_CONFIG = {
  storageKey: 'recordlane-cache',
  version: '1.0',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  cleanupInterval: 60 * 60 * 1000,
};

// Development Configuration
export const DEV_CONFIG = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  mockAPI: false,
  skipOnboarding: false,
  allowPopupFallback: true,
  enableRedirectFallback: true,
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  baseUrl: '/api',
  trackingEnabled: FEATURES.analytics,
  sessionTimeout: 30 * 60 * 1000,
  batchSize: 10,
  flushInterval: 5 * 60 * 1000,
};
