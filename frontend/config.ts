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

// Environment-specific configuration - UPDATED for RecordLane
export const getRedirectUri = (): string => {
  if (typeof window === 'undefined') {
    return 'https://recordlane.com';
  }
  
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // For Leap development environment - RecordLane
  if (origin.includes('loom-clone-d2qv2u482vjq7vcc59sg.lp.dev')) {
    return 'https://loom-clone-d2qv2u482vjq7vcc59sg.lp.dev';
  }
  
  // Development URLs (any *.lp.dev domain)
  if (hostname.includes('.lp.dev')) {
    return origin;
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Production fallback
  return 'https://recordlane.com';
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
  DRIVE_NOT_CONNECTED: 'Please connect your