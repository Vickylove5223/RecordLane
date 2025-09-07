import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthResponse {
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

const startTime = Date.now();

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

    const now = new Date()
    const uptime = Date.now() - startTime
    
    // Check database connectivity
    let databaseStatus: "healthy" | "unhealthy" = "healthy"
    try {
      const { error } = await supabase.from('recordings').select('id').limit(1)
      if (error) throw error
    } catch (error) {
      console.error("Database health check failed:", error)
      databaseStatus = "unhealthy"
    }

    // Check metadata service (recordings table)
    let metadataStatus: "healthy" | "unhealthy" = "healthy"
    try {
      const { error } = await supabase.from('recordings').select('id').limit(1)
      if (error) throw error
    } catch (error) {
      console.error("Metadata service health check failed:", error)
      metadataStatus = "unhealthy"
    }

    // Check analytics service (events table)
    let analyticsStatus: "healthy" | "unhealthy" = "healthy"
    try {
      const { error } = await supabase.from('events').select('id').limit(1)
      if (error) throw error
    } catch (error) {
      console.error("Analytics service health check failed:", error)
      analyticsStatus = "unhealthy"
    }

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy"
    if (databaseStatus === "unhealthy" || metadataStatus === "unhealthy") {
      overallStatus = "unhealthy"
    } else if (analyticsStatus === "unhealthy") {
      overallStatus = "degraded"
    }

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: now,
      version: "1.0.0",
      services: {
        metadata: metadataStatus,
        analytics: analyticsStatus,
        database: databaseStatus,
      },
      uptime,
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    const errorResponse: HealthResponse = {
      status: "unhealthy",
      timestamp: new Date(),
      version: "1.0.0",
      services: {
        metadata: "unhealthy",
        analytics: "unhealthy",
        database: "unhealthy",
      },
      uptime: Date.now() - startTime,
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
