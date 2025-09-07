import { supabase, Recording } from '../lib/supabase'

export interface CreateRecordingRequest {
  title: string
  youtubeVideoId: string
  youtubeLink: string
  duration: number
  privacy: 'private' | 'unlisted' | 'public'
  thumbnailUrl?: string
}

export interface ListRecordingsRequest {
  limit?: number
  offset?: number
  search?: string
}

export interface ListRecordingsResponse {
  recordings: Recording[]
  total: number
  hasMore: boolean
}

export interface UpdateRecordingRequest {
  id: string
  title?: string
  privacy?: 'private' | 'unlisted' | 'public'
  thumbnailUrl?: string
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Create a new recording
export async function createRecording(data: CreateRecordingRequest): Promise<Recording> {
  const id = generateId()
  const now = new Date().toISOString()
  
  const recordingData = {
    id,
    title: data.title,
    youtube_video_id: data.youtubeVideoId,
    youtube_link: data.youtubeLink,
    duration: data.duration,
    privacy: data.privacy,
    thumbnail_url: data.thumbnailUrl || null,
    created_at: now,
    updated_at: now
  }

  const { data: recording, error } = await supabase
    .from('recordings')
    .insert(recordingData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create recording: ${error.message}`)
  }

  return recording
}

// Get a single recording by ID
export async function getRecording(id: string): Promise<Recording | null> {
  const { data: recording, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to get recording: ${error.message}`)
  }

  return recording
}

// List recordings with pagination and search
export async function listRecordings(params: ListRecordingsRequest = {}): Promise<ListRecordingsResponse> {
  const { limit = 20, offset = 0, search } = params

  let query = supabase
    .from('recordings')
    .select('*', { count: 'exact' })

  // Apply search filter if provided
  if (search?.trim()) {
    query = query.ilike('title', `%${search.trim()}%`)
  }

  // Apply pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: recordings, error, count } = await query

  if (error) {
    throw new Error(`Failed to list recordings: ${error.message}`)
  }

  const total = count || 0
  const hasMore = offset + (recordings?.length || 0) < total

  return {
    recordings: recordings || [],
    total,
    hasMore
  }
}

// Update a recording
export async function updateRecording(data: UpdateRecordingRequest): Promise<Recording> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (data.title !== undefined) updateData.title = data.title
  if (data.privacy !== undefined) updateData.privacy = data.privacy
  if (data.thumbnailUrl !== undefined) updateData.thumbnail_url = data.thumbnailUrl

  const { data: recording, error } = await supabase
    .from('recordings')
    .update(updateData)
    .eq('id', data.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update recording: ${error.message}`)
  }

  return recording
}

// Delete a recording
export async function deleteRecording(id: string): Promise<void> {
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete recording: ${error.message}`)
  }
}

