import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GetStatsRequest {
  days?: number;
}

interface UsageStats {
  totalRecordings: number;
  totalDuration: number;
  eventsLastNDays: number;
  popularEvents: Array<{ eventType: string; count: number }>;
  dailyStats: Array<{ date: string; recordings: number; events: number }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '30')
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get total recordings count
    const { count: totalRecordings, error: recordingsError } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })

    if (recordingsError) {
      throw recordingsError
    }

    // Get total duration
    const { data: allRecordings, error: durationError } = await supabase
      .from('recordings')
      .select('duration')

    if (durationError) {
      throw durationError
    }

    const totalDuration = (allRecordings || []).reduce(
      (sum: number, r: any) => sum + (r.duration || 0),
      0
    )

    // Get events count for last N days
    const { count: eventsLastNDays, error: eventsError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', cutoffDate.toISOString())

    if (eventsError) {
      throw eventsError
    }

    // Get popular event types
    const { data: popularEventsData, error: popularEventsError } = await supabase
      .from('events')
      .select('event_type')
      .gte('created_at', cutoffDate.toISOString())

    if (popularEventsError) {
      throw popularEventsError
    }

    // Count event types
    const eventTypeCounts: { [key: string]: number } = {}
    ;(popularEventsData || []).forEach((event: any) => {
      const eventType = event.event_type
      eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1
    })

    const popularEvents = Object.entries(eventTypeCounts)
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get daily stats
    const { data: dailyRecordings, error: dailyRecordingsError } = await supabase
      .from('recordings')
      .select('created_at')
      .gte('created_at', cutoffDate.toISOString())

    if (dailyRecordingsError) {
      throw dailyRecordingsError
    }

    const { data: dailyEvents, error: dailyEventsError } = await supabase
      .from('events')
      .select('created_at')
      .gte('created_at', cutoffDate.toISOString())

    if (dailyEventsError) {
      throw dailyEventsError
    }

    // Group by date
    const dailyStatsMap: { [key: string]: { recordings: number; events: number } } = {}
    
    // Initialize all days in range
    for (let i = 0; i < days; i++) {
      const date = new Date(cutoffDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyStatsMap[dateStr] = { recordings: 0, events: 0 }
    }

    // Count recordings by date
    ;(dailyRecordings || []).forEach((recording: any) => {
      const dateStr = new Date(recording.created_at).toISOString().split('T')[0]
      if (dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr].recordings++
      }
    })

    // Count events by date
    ;(dailyEvents || []).forEach((event: any) => {
      const dateStr = new Date(event.created_at).toISOString().split('T')[0]
      if (dailyStatsMap[dateStr]) {
        dailyStatsMap[dateStr].events++
      }
    })

    const dailyStats = Object.entries(dailyStatsMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const response: UsageStats = {
      totalRecordings: totalRecordings || 0,
      totalDuration,
      eventsLastNDays: eventsLastNDays || 0,
      popularEvents,
      dailyStats,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
