// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here',
}

// API Configuration
export const API_CONFIG = {
  baseUrl: SUPABASE_CONFIG.url.replace('http://localhost:54321', 'http://localhost:54321/functions/v1'),
  endpoints: {
    health: '/health',
    recordings: '/recordings',
    analytics: '/analytics',
    auth: '/auth',
  }
}
