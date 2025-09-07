import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthConfigResponse {
  clientID: string;
}

interface ExchangeCodeRequest {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const method = req.method
    const pathname = url.pathname

    if (pathname === '/auth/config' && method === 'GET') {
      // Get auth config
      const clientID = Deno.env.get('GOOGLE_CLIENT_ID') || ''
      
      const response: AuthConfigResponse = {
        clientID,
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (pathname === '/auth/google/exchange-code' && method === 'POST') {
      // Exchange code for token
      const body: ExchangeCodeRequest = await req.json()
      const { code, codeVerifier, redirectUri } = body

      const clientID = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

      if (!clientID || !clientSecret) {
        return new Response(JSON.stringify({ error: 'OAuth credentials not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      const tokenData = new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        code: code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })

      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token exchange failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
        return new Response(JSON.stringify({ error: `Token exchange failed: ${errorText}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }

      const tokenResponse: TokenResponse = await response.json()

      return new Response(JSON.stringify(tokenResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (pathname === '/auth/google/refresh-token' && method === 'POST') {
      // Refresh token
      const body: RefreshTokenRequest = await req.json()
      const { refreshToken } = body

      const clientID = Deno.env.get('GOOGLE_CLIENT_ID')
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

      if (!clientID || !clientSecret) {
        return new Response(JSON.stringify({ error: 'OAuth credentials not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      const tokenData = new URLSearchParams({
        client_id: clientID,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })

      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        })
        return new Response(JSON.stringify({ error: `Token refresh failed: ${errorText}` }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const tokenResponse = await response.json()

      return new Response(JSON.stringify(tokenResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })
  } catch (error) {
    console.error('Auth API error:', error)
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
