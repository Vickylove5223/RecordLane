// Supabase client replacement for Encore client
// This maintains the same API interface as the original Encore client

import { 
  createRecording, 
  getRecording, 
  listRecordings, 
  updateRecording, 
  deleteRecording,
  trackEvent, 
  getStats,
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
  type CreateRecordingRequest,
  type ListRecordingsRequest,
  type ListRecordingsResponse,
  type UpdateRecordingRequest,
  type TrackEventRequest,
  type EventResponse,
  type GetStatsRequest,
  type StatsResponse,
  type AuthUser,
  type AuthResponse,
  type SignUpRequest,
  type SignInRequest
} from './services/supabaseServiceAdapter'

// Re-export types for compatibility
export type { 
  CreateRecordingRequest,
  ListRecordingsRequest,
  ListRecordingsResponse,
  UpdateRecordingRequest,
  TrackEventRequest,
  EventResponse,
  GetStatsRequest,
  StatsResponse,
  AuthUser,
  AuthResponse,
  SignUpRequest,
  SignInRequest
}

// Analytics service client
export class AnalyticsServiceClient {
  /**
   * Retrieves anonymous usage statistics for the application.
   */
  public async getStats(params: GetStatsRequest): Promise<StatsResponse> {
    return getStats(params)
  }

  /**
   * Tracks an analytics event for privacy-respecting usage insights.
   */
  public async trackEvent(params: TrackEventRequest): Promise<EventResponse> {
    return trackEvent(params)
  }
}

// Auth service client
export class AuthServiceClient {
  /**
   * Exchanges an authorization code for an access token.
   */
  public async exchangeCode(params: { code: string }): Promise<AuthResponse> {
    // For Supabase, we don't need to exchange codes manually
    // The OAuth flow is handled by signInWithGoogle/signInWithGitHub
    throw new Error('Use signInWithGoogle or signInWithGitHub instead of exchangeCode')
  }

  /**
   * Retrieves the public configuration for the auth service.
   */
  public async getConfig(): Promise<{ googleClientId: string }> {
    // Return a mock config for compatibility
    return {
      googleClientId: 'your-google-client-id' // This should be configured in Supabase
    }
  }

  /**
   * Refreshes an access token using a refresh token.
   */
  public async refreshToken(params: { refreshToken: string }): Promise<AuthResponse> {
    // Supabase handles token refresh automatically
    // This is just for compatibility
    const session = await getCurrentSession()
    return {
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        user_metadata: session.user.user_metadata,
        app_metadata: session.user.app_metadata
      } : null,
      session,
      error: null
    }
  }

  // Additional Supabase-specific methods
  public async getCurrentUser(): Promise<AuthUser | null> {
    return getCurrentUser()
  }

  public async getCurrentSession() {
    return getCurrentSession()
  }

  public async signUp(params: SignUpRequest): Promise<AuthResponse> {
    return signUp(params)
  }

  public async signIn(params: SignInRequest): Promise<AuthResponse> {
    return signIn(params)
  }

  public async signOut() {
    return signOut()
  }

  public async signInWithGoogle() {
    return signInWithGoogle()
  }

  public async signInWithGitHub() {
    return signInWithGitHub()
  }

  public async resetPassword(email: string) {
    return resetPassword(email)
  }

  public async updatePassword(password: string) {
    return updatePassword(password)
  }

  public onAuthStateChange(callback: (event: string, session: any) => void) {
    return onAuthStateChange(callback)
  }
}

// Health service client (mock for compatibility)
export class HealthServiceClient {
  /**
   * Returns the health status of the RecordLane backend services.
   */
  public async check(): Promise<{ status: string; timestamp: string }> {
    // For Supabase, we can check if we can connect to the database
    try {
      const { data, error } = await import('./lib/supabase').then(m => 
        m.supabase.from('recordings').select('count', { count: 'exact', head: true })
      )
      
      if (error) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      }
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      }
    }
  }
}

// Metadata service client
export class MetadataServiceClient {
  /**
   * Creates a new recording metadata entry.
   */
  public async create(params: CreateRecordingRequest): Promise<any> {
    return createRecording(params)
  }

  /**
   * Deletes a recording metadata entry.
   */
  public async deleteRecording(params: { id: string }): Promise<void> {
    return deleteRecording(params.id)
  }

  /**
   * Retrieves a recording by its ID.
   */
  public async get(params: { id: string }): Promise<any> {
    return getRecording(params.id)
  }

  /**
   * Retrieves all recordings, ordered by creation date (latest first).
   */
  public async list(params: ListRecordingsRequest): Promise<ListRecordingsResponse> {
    return listRecordings(params)
  }

  /**
   * Updates a recording's metadata.
   */
  public async update(params: UpdateRecordingRequest): Promise<any> {
    return updateRecording(params)
  }
}

// Main client class
export class Client {
  public readonly analytics: AnalyticsServiceClient
  public readonly auth: AuthServiceClient
  public readonly health: HealthServiceClient
  public readonly metadata: MetadataServiceClient

  constructor() {
    this.analytics = new AnalyticsServiceClient()
    this.auth = new AuthServiceClient()
    this.health = new HealthServiceClient()
    this.metadata = new MetadataServiceClient()
  }

  /**
   * Creates a new client with the given options (for compatibility)
   */
  public with(options: any): Client {
    // For Supabase, we don't need different configurations
    return new Client()
  }
}

// Create and export the default client instance
export default new Client()

