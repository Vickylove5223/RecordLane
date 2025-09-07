// Production Supabase Configuration
export const PRODUCTION_CONFIG = {
  supabase: {
    url: 'https://yoccwqyrxdymrfqjpwef.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here',
  },
  api: {
    baseUrl: 'https://yoccwqyrxdymrfqjpwef.supabase.co/functions/v1',
  }
}
