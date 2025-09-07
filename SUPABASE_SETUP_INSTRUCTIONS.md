# Supabase Migration Setup Instructions

## Prerequisites

1. **Supabase Project**: Create a new project at https://supabase.com
2. **Environment Variables**: Set up your Supabase credentials

## Step 1: Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Choose a name for your project (e.g., "recordlane")
3. Set a strong database password
4. Select a region close to your users
5. Wait for the project to be created (usually takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google OAuth (if you want to keep Google auth)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order:

### First, run `supabase-migrations/01_create_recordings_table.sql`:

```sql
-- Create recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(255) NOT NULL UNIQUE,
  youtube_link TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 0),
  privacy VARCHAR(50) NOT NULL CHECK (privacy IN ('private', 'unlisted', 'public')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient listing (ordered by creation date)
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);

-- Index for searching by title
CREATE INDEX IF NOT EXISTS idx_recordings_title ON recordings USING gin(to_tsvector('english', title));

-- Index for youtube video ID lookups
CREATE INDEX IF NOT EXISTS idx_recordings_youtube_video_id ON recordings(youtube_video_id);

-- Enable Row Level Security
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (adjust based on your privacy requirements)
CREATE POLICY "Allow public read access" ON recordings
  FOR SELECT USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON recordings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated update" ON recordings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON recordings
  FOR DELETE USING (auth.role() = 'authenticated');
```

### Then, run `supabase-migrations/02_create_events_table.sql`:

```sql
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  session_id VARCHAR(255),
  user_agent TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by event type
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Index for session-based analytics
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;

-- Index for recording-specific events
CREATE INDEX IF NOT EXISTS idx_events_recording_id ON events(recording_id) WHERE recording_id IS NOT NULL;

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_events_type_date ON events(event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert access (for analytics)
CREATE POLICY "Allow public insert" ON events
  FOR INSERT WITH CHECK (true);

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated read" ON events
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Step 5: Configure Authentication (Optional)

If you want to use Supabase authentication:

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Enable the providers you want (Google, GitHub, etc.)
3. Configure OAuth settings for each provider
4. Update the callback URLs to include your domain

## Step 6: Update Supabase Configuration

Update the configuration files with your actual Supabase credentials:

1. **Update `frontend/config/supabase.ts`**:
   ```typescript
   export const supabaseConfig = {
     url: 'https://your-actual-project-id.supabase.co',
     anonKey: 'your-actual-anon-key'
   }
   ```

2. **Update `frontend/auth/callback.html`**:
   - Replace `https://your-project.supabase.co` with your actual Supabase URL
   - Replace `your-anon-key` with your actual anon key

## Step 7: Test the Migration

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:5173`

3. Test the following features:
   - Recording creation and listing
   - Analytics tracking
   - Authentication (if configured)

## Step 8: Deploy to Production

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the built files to your hosting service
3. Update environment variables in your production environment
4. Test all functionality in production

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Check that your Supabase URL and anon key are correct
2. **"Table doesn't exist"**: Make sure you ran the migration scripts
3. **"Permission denied"**: Check your Row Level Security policies
4. **CORS errors**: Ensure your domain is added to Supabase allowed origins

### Getting Help:

- Check the Supabase documentation: https://supabase.com/docs
- Check the browser console for error messages
- Verify your environment variables are set correctly

## Migration Benefits

✅ **Simplified Architecture**: No need for separate backend services  
✅ **Built-in Authentication**: OAuth, email/password, and more  
✅ **Real-time Features**: Built-in subscriptions and real-time updates  
✅ **Automatic Scaling**: Handles traffic spikes automatically  
✅ **Better Performance**: Global CDN and edge functions  
✅ **Cost Effective**: Pay only for what you use  

## Next Steps

After successful migration:
1. Remove the old Encore backend code
2. Update your deployment pipeline
3. Monitor performance and usage
4. Consider adding more Supabase features (Edge Functions, Storage, etc.)

