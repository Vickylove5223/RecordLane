// Supabase Configuration
// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project dashboard under Settings > API

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://yoccwqyrxdymrfqjpwef.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2N3cXlyeGR5bXJmcWpwd2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMDU3NzQsImV4cCI6MjA3Mjc4MTc3NH0.A-UU51XVrGN-r9OLNrF3ASf9LZXCTy3bXN0pcM9zCno'
}

// Validate required environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Using default Supabase credentials. For production, create a .env.local file with:\n' +
    'VITE_SUPABASE_URL=your_supabase_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  )
}

// TODO: Replace with your actual Supabase credentials
// 1. Go to https://supabase.com and create a new project
// 2. Go to Settings > API in your Supabase dashboard  
// 3. Copy the Project URL and anon/public key
// 4. Update the values above or create a .env.local file with:
//    VITE_SUPABASE_URL=your_actual_url
//    VITE_SUPABASE_ANON_KEY=your_actual_key

// Instructions for setup:
// 1. Go to your Supabase project dashboard
// 2. Navigate to Settings > API
// 3. Copy the Project URL and anon/public key
// 4. Create a .env.local file in the frontend directory with:
//    VITE_SUPABASE_URL=your_actual_url
//    VITE_SUPABASE_ANON_KEY=your_actual_key
