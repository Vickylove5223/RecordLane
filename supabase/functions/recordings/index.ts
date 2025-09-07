import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

interface Recording {
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

interface ListRecordingsRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

interface ListRecordingsResponse {
  recordings: Recording[];
  total: number;
  hasMore: boolean;
}

function generateId(): string {
  // Generate a cryptographically secure UUID v4
  return crypto.randomUUID();
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
    const method = req.method

    if (method === 'GET') {
      // List recordings
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const search = url.searchParams.get('search')?.trim()

      let query = supabase
        .from('recordings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data: recordings, error, count } = await query

      if (error) {
        throw error
      }

      const total = count || 0
      const hasMore = offset + (recordings?.length || 0) < total

      const response: ListRecordingsResponse = {
        recordings: (recordings || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          youtubeVideoId: r.youtube_video_id,
          youtubeLink: r.youtube_link,
          duration: r.duration,
          privacy: r.privacy,
          thumbnailUrl: r.thumbnail_url,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        })),
        total,
        hasMore,
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'POST') {
      // Create recording
      const body = await req.json()
      const { title, youtubeVideoId, youtubeLink, duration, privacy, thumbnailUrl } = body

      // Input validation
      if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 500) {
        return new Response(JSON.stringify({ error: 'Invalid title: must be a non-empty string with max 500 characters' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (!youtubeVideoId || typeof youtubeVideoId !== 'string' || youtubeVideoId.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid YouTube video ID' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (!youtubeLink || typeof youtubeLink !== 'string' || !youtubeLink.startsWith('https://')) {
        return new Response(JSON.stringify({ error: 'Invalid YouTube link: must be a valid HTTPS URL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (typeof duration !== 'number' || duration < 0 || duration > 86400) { // Max 24 hours
        return new Response(JSON.stringify({ error: 'Invalid duration: must be a number between 0 and 86400 seconds' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (!privacy || !['private', 'unlisted', 'public'].includes(privacy)) {
        return new Response(JSON.stringify({ error: 'Invalid privacy setting: must be private, unlisted, or public' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      if (thumbnailUrl && (typeof thumbnailUrl !== 'string' || !thumbnailUrl.startsWith('https://'))) {
        return new Response(JSON.stringify({ error: 'Invalid thumbnail URL: must be a valid HTTPS URL' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const id = generateId()
      const now = new Date()

      const { data, error } = await supabase
        .from('recordings')
        .insert({
          id,
          title,
          youtube_video_id: youtubeVideoId,
          youtube_link: youtubeLink,
          duration,
          privacy,
          thumbnail_url: thumbnailUrl,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const recording: Recording = {
        id: data.id,
        title: data.title,
        youtubeVideoId: data.youtube_video_id,
        youtubeLink: data.youtube_link,
        duration: data.duration,
        privacy: data.privacy,
        thumbnailUrl: data.thumbnail_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }

      return new Response(JSON.stringify(recording), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  } catch (error) {
    console.error('Recordings API error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
