// Configuration for the RecordLane application

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = '104046752889-schirpg4cp1ckr4i587dmc97qhlkmjnt.apps.googleusercontent.com';

// YouTube API Configuration
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
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

// Environment-specific configuration - RecordLane URLs
export const getRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    // Default for server-side or non-browser environments, using the primary dev URL.
    return 'https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev/auth/callback';
  }
  
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // For any Leap development environment or local development
  if (hostname.includes('.lp.dev') || hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${origin}/auth/callback`;
  }
  
  // Fallback to the specific Leap dev URL if no other condition is met.
  // This case should ideally not be hit in a known environment.
  return 'https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev/auth/callback';
};

// Popup configuration for OAuth
export const POPUP_CONFIG = {
  width: 500,
  height: 700,
  scrollbars: 'yes',
  resizable: 'yes',
  centerscreen: 'yes',
  windowName: 'google_oauth_popup',
  pollInterval: 500,
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
  offlineMode: true,
  analytics: true,
};

// Error Messages
export const ERROR_MESSAGES = {
  DRIVE_NOT_CONNECTED: 'Please connect your YouTube account before recording',
  PERMISSIONS_DENIED: 'Recording permissions were denied. Please allow camera and screen access in your browser settings, then try again.',
  UPLOAD_FAILED: 'Failed to upload recording to YouTube',
  RECORDING_FAILED: 'Failed to start recording. Please check your browser permissions and try again.',
  NETWORK_ERROR: 'Network connection error. Please check your internet.',
  STORAGE_QUOTA_EXCEEDED: 'YouTube storage quota exceeded',
  BROWSER_NOT_SUPPORTED: 'Your browser does not support screen recording. Please use Chrome, Edge, or Firefox.',
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
  TOKEN_REFRESH_FAILED: 'Failed to refresh authentication token. Please sign in again.',
  AUTH_TOKEN_INVALID: 'Authentication token is invalid. Please sign in again.',
  INVALID_GRANT: 'Invalid grant. Please re-authenticate.',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired. Please sign in again.',
  DEVICE_NOT_FOUND: 'Recording device not found. Please check your camera and microphone connections.',
  DEVICE_IN_USE: 'Recording device is currently in use by another application. Please close other apps and try again.',
  SECURITY_ERROR: 'Recording blocked due to security restrictions. Please ensure you are using HTTPS.',
  CONSTRAINTS_NOT_SATISFIED: 'Recording settings could not be applied. Please try with different settings.',
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
  enableRedirectFallback: false,
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  baseUrl: '/api',
  trackingEnabled: FEATURES.analytics,
  sessionTimeout: 30 * 60 * 1000,
  batchSize: 10,
  flushInterval: 5 * 60 * 1000,
};

// Token Refresh Configuration
export const TOKEN_CONFIG = {
  refreshThreshold: 5 * 60 * 1000,
  maxRefreshRetries: 3,
  refreshRetryDelay: 1000,
  autoRefreshEnabled: true,
  proactiveRefreshThreshold: 15 * 60 * 1000,
};

// PKCE Configuration
export const PKCE_CONFIG = {
  codeVerifierLength: 128,
  codeChallengeMethod: 'S256',
  stateLength: 32,
};
