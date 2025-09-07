// Service adapter for RecordLane frontend
// This file provides the API interface for the application

import { 
  createRecording, 
  getRecording, 
  listRecordings, 
  updateRecording, 
  deleteRecording,
  type CreateRecordingRequest,
  type ListRecordingsRequest,
  type ListRecordingsResponse,
  type UpdateRecordingRequest
} from './supabaseRecordingService'

import { 
  trackEvent, 
  getStats,
  type TrackEventRequest,
  type EventResponse,
  type GetStatsRequest,
  type StatsResponse
} from './supabaseAnalyticsService'

import { 
  getCurrentUser, 
  getCurrentSession, 
  signUp, 
  signIn, 
  signOut, 
  signInWithGoogle, 
  signInWithGitHub,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  type AuthUser,
  type AuthResponse,
  type SignUpRequest,
  type SignInRequest
} from './supabaseAuthService'

// Re-export all types and functions for the application
export {
  // Recording service
  createRecording,
  getRecording,
  listRecordings,
  updateRecording,
  deleteRecording,
  type CreateRecordingRequest,
  type ListRecordingsRequest,
  type ListRecordingsResponse,
  type UpdateRecordingRequest,
  
  // Analytics service
  trackEvent,
  getStats,
  type TrackEventRequest,
  type EventResponse,
  type GetStatsRequest,
  type StatsResponse,
  
  // Auth service
  getCurrentUser,
  getCurrentSession,
  signUp,
  signIn,
  signOut,
  signInWithGoogle,
  signInWithGitHub,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  type AuthUser,
  type AuthResponse,
  type SignUpRequest,
  type SignInRequest
}

// Legacy API compatibility - these functions maintain the same interface as the original APIs
export const metadataService = {
  create: createRecording,
  get: getRecording,
  list: listRecordings,
  update: updateRecording,
  delete: deleteRecording
}

export const analyticsService = {
  trackEvent,
  getStats
}

export const authService = {
  getCurrentUser,
  getCurrentSession,
  signUp,
  signIn,
  signOut,
  signInWithGoogle,
  signInWithGitHub,
  resetPassword,
  updatePassword,
  onAuthStateChange
}

