// Supabase Configuration
// Replace these with your actual Supabase project credentials
// You can find these in your Supabase project dashboard under Settings > API

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
}

// Validate required environment variables
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error(
    'Missing required Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
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
