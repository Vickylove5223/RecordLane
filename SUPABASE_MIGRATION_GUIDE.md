# Supabase Migration Guide

This guide will help you migrate from Encore to Supabase while preserving your UI/UX design.

## Prerequisites

1. **Supabase Project Setup**
   - Create a new Supabase project at https://supabase.com
   - Note down your project URL and anon key from Settings > API

2. **Environment Variables**
   - Create a `.env.local` file in the `frontend` directory
   - Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_actual_supabase_url
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

## Migration Steps

### Step 1: Database Setup ✅
- [x] Supabase client configuration
- [x] Database schema creation scripts
- [x] Row Level Security policies

### Step 2: Run Database Migrations
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `supabase-migrations/01_create_recordings_table.sql`
   - `supabase-migrations/02_create_events_table.sql`

### Step 3: API Migration
- [ ] Replace Encore APIs with Supabase-based services
- [ ] Update frontend services to use new APIs
- [ ] Implement authentication

### Step 4: Testing
- [ ] Test all functionality
- [ ] Verify data integrity
- [ ] Performance testing

## Database Schema

### Recordings Table
- `id`: Primary key (VARCHAR)
- `title`: Recording title (VARCHAR)
- `youtube_video_id`: YouTube video ID (VARCHAR, UNIQUE)
- `youtube_link`: Full YouTube URL (TEXT)
- `duration`: Duration in seconds (INTEGER)
- `privacy`: Privacy setting (VARCHAR: private/unlisted/public)
- `thumbnail_url`: Thumbnail URL (TEXT, optional)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Events Table
- `id`: Primary key (VARCHAR)
- `event_type`: Type of event (VARCHAR)
- `recording_id`: Associated recording ID (VARCHAR, optional)
- `session_id`: Session identifier (VARCHAR, optional)
- `user_agent`: User agent string (TEXT, optional)
- `properties`: Additional event data (JSONB)
- `created_at`: Event timestamp

## Security

- Row Level Security (RLS) is enabled on all tables
- Public read access for recordings (adjust based on privacy needs)
- Authenticated users can insert/update/delete recordings
- Public insert access for analytics events
- Authenticated users can read analytics events

## Next Steps

1. Set up your Supabase project and run the migrations
2. Update your environment variables
3. Continue with the API migration process

