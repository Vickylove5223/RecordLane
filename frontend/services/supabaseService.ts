import { supabase, apiCall } from '../lib/supabase'

// Types
export interface Recording {
  id: string;
  title: string;
  youtubeVideoId: string;
  youtubeLink: string;
  duration: number;
  privacy: "private" | "unlisted" | "public";
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListRecordingsRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ListRecordingsResponse {
  recordings: Recording[];
  total: number;
  hasMore: boolean;
}

export interface CreateRecordingRequest {
  title: string;
  youtubeVideoId: string;
  youtubeLink: string;
  duration: number;
  privacy: "private" | "unlisted" | "public";
  thumbnailUrl?: string;
}

export interface UsageStats {
  totalRecordings: number;
  totalDuration: number;
  eventsLastNDays: number;
  popularEvents: Array<{ eventType: string; count: number }>;
  dailyStats: Array<{ date: string; recordings: number; events: number }>;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  version: string;
  services: {
    metadata: "healthy" | "unhealthy";
    analytics: "healthy" | "unhealthy";
    database: "healthy" | "unhealthy";
  };
  uptime: number;
}

export interface AuthConfigResponse {
  clientID: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ExchangeCodeRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

// Metadata Service
export class MetadataService {
  static async list(params: ListRecordingsRequest = {}): Promise<ListRecordingsResponse> {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.offset) searchParams.set('offset', params.offset.toString())
    if (params.search) searchParams.set('search', params.search)

    const url = `${api.recordings}?${searchParams.toString()}`
    return apiCall<ListRecordingsResponse>(url)
  }

  static async create(recording: CreateRecordingRequest): Promise<Recording> {
    return apiCall<Recording>(api.recordings, {
      method: 'POST',
      body: JSON.stringify(recording),
    })
  }

  static async get(id: string): Promise<Recording> {
    const response = await this.list({ limit: 1, offset: 0 })
    const recording = response.recordings.find(r => r.id === id)
    if (!recording) {
      throw new Error('Recording not found')
    }
    return recording
  }

  static async delete(id: string): Promise<void> {
    // Note: This would need to be implemented in the Supabase Edge Function
    // For now, we'll throw an error indicating it's not implemented
    throw new Error('Delete functionality not yet implemented in Supabase migration')
  }
}

// Analytics Service
export class AnalyticsService {
  static async getStats(params: { days?: number } = {}): Promise<UsageStats> {
    const searchParams = new URLSearchParams()
    if (params.days) searchParams.set('days', params.days.toString())

    const url = `${api.analytics}?${searchParams.toString()}`
    return apiCall<UsageStats>(url)
  }

  static async trackEvent(eventType: string, properties: Record<string, any> = {}): Promise<void> {
    // For now, we'll use Supabase's built-in analytics or store in events table
    // This would need to be implemented based on your analytics requirements
    console.log('Event tracked:', { eventType, properties })
  }
}

// Health Service
export class HealthService {
  static async check(): Promise<HealthResponse> {
    return apiCall<HealthResponse>(api.health)
  }
}

// Auth Service
export class AuthService {
  static async getConfig(): Promise<AuthConfigResponse> {
    return apiCall<AuthConfigResponse>(`${api.auth}/config`)
  }

  static async exchangeCode(params: ExchangeCodeRequest): Promise<TokenResponse> {
    return apiCall<TokenResponse>(`${api.auth}/google/exchange-code`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  static async refreshToken(params: RefreshTokenRequest): Promise<TokenResponse> {
    return apiCall<TokenResponse>(`${api.auth}/google/refresh-token`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }
}
