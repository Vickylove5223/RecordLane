import { supabase, Event } from '../lib/supabase'

export interface TrackEventRequest {
  eventType: string
  recordingId?: string
  sessionId?: string
  userAgent?: string
  properties?: Record<string, any>
}

export interface EventResponse {
  success: boolean
}

export interface GetStatsRequest {
  startDate?: string
  endDate?: string
  eventType?: string
  recordingId?: string
}

export interface StatsResponse {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsByDate: Array<{
    date: string
    count: number
  }>
  topRecordings: Array<{
    recording_id: string
    count: number
  }>
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Track an analytics event
export async function trackEvent(data: TrackEventRequest): Promise<EventResponse> {
  const eventId = generateId()
  const now = new Date().toISOString()
  
  const eventData = {
    id: eventId,
    event_type: data.eventType,
    recording_id: data.recordingId || null,
    session_id: data.sessionId || null,
    user_agent: data.userAgent || null,
    properties: data.properties || {},
    created_at: now
  }

  const { error } = await supabase
    .from('events')
    .insert(eventData)

  if (error) {
    throw new Error(`Failed to track event: ${error.message}`)
  }

  return { success: true }
}

// Get analytics statistics
export async function getStats(params: GetStatsRequest = {}): Promise<StatsResponse> {
  const { startDate, endDate, eventType, recordingId } = params

  let query = supabase
    .from('events')
    .select('*')

  // Apply filters
  if (startDate) {
    query = query.gte('created_at', startDate)
  }
  if (endDate) {
    query = query.lte('created_at', endDate)
  }
  if (eventType) {
    query = query.eq('event_type', eventType)
  }
  if (recordingId) {
    query = query.eq('recording_id', recordingId)
  }

  const { data: events, error } = await query

  if (error) {
    throw new Error(`Failed to get stats: ${error.message}`)
  }

  const eventsList = events || []

  // Calculate total events
  const totalEvents = eventsList.length

  // Calculate events by type
  const eventsByType: Record<string, number> = {}
  eventsList.forEach(event => {
    eventsByType[event.event_type] = (eventsByType[event.event_type] || 0) + 1
  })

  // Calculate events by date
  const eventsByDateMap: Record<string, number> = {}
  eventsList.forEach(event => {
    const date = event.created_at.split('T')[0] // Extract date part
    eventsByDateMap[date] = (eventsByDateMap[date] || 0) + 1
  })

  const eventsByDate = Object.entries(eventsByDateMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate top recordings
  const recordingCounts: Record<string, number> = {}
  eventsList.forEach(event => {
    if (event.recording_id) {
      recordingCounts[event.recording_id] = (recordingCounts[event.recording_id] || 0) + 1
    }
  })

  const topRecordings = Object.entries(recordingCounts)
    .map(([recording_id, count]) => ({ recording_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10

  return {
    totalEvents,
    eventsByType,
    eventsByDate,
    topRecordings
  }
}

// Get events for a specific recording
export async function getRecordingEvents(recordingId: string): Promise<Event[]> {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('recording_id', recordingId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get recording events: ${error.message}`)
  }

  return events || []
}

