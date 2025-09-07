import { createClient } from '@supabase/supabase-js'

// Use production Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yoccwqyrxdymrfqjpwef.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// API endpoints
export const API_BASE_URL = supabaseUrl.includes('localhost') 
  ? supabaseUrl.replace('http://localhost:54321', 'http://localhost:54321/functions/v1')
  : `${supabaseUrl}/functions/v1`

export const api = {
  health: `${API_BASE_URL}/health`,
  recordings: `${API_BASE_URL}/recordings`,
  analytics: `${API_BASE_URL}/analytics`,
  auth: `${API_BASE_URL}/auth`,
}

// Helper function to make API calls
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API call failed: ${response.status} ${error}`)
  }

  return response.json()
}
