# Supabase Setup Checklist

## ✅ Step 1: Create Supabase Project

1. **Go to https://supabase.com**
2. **Click "Start your project"**
3. **Sign in with GitHub/Google or create account**
4. **Click "New Project"**
5. **Fill in project details:**
   - Organization: Select or create one
   - Project name: `recordlane` (or your preferred name)
   - Database password: Create a strong password (save this!)
   - Region: Choose closest to your users
6. **Click "Create new project"**
7. **Wait for project to be created (1-2 minutes)**

## ✅ Step 2: Get Your Credentials

1. **In your Supabase dashboard, go to Settings → API**
2. **Copy these values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## ✅ Step 3: Set Environment Variables

**Option A: Create .env.local file (Recommended)**
1. Create a file called `.env.local` in the `frontend` directory
2. Add these lines (replace with your actual values):
```
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```

**Option B: Update config file directly**
1. Open `frontend/config/supabase.ts`
2. Replace the placeholder values with your actual credentials

## ✅ Step 4: Create Database Tables

1. **In your Supabase dashboard, go to SQL Editor**
2. **Click "New query"**
3. **Copy and paste the first migration script:**

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

4. **Click "Run"**
5. **You should see "Success. No rows returned"**

6. **Now run the second migration script:**

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

7. **Click "Run"**
8. **You should see "Success. No rows returned"**

## ✅ Step 5: Verify Tables Created

1. **In your Supabase dashboard, go to Table Editor**
2. **You should see two tables:**
   - `recordings`
   - `events`
3. **Click on each table to verify the structure**

## ✅ Step 6: Test the Application

1. **Open a new terminal/command prompt**
2. **Navigate to the frontend directory:**
   ```bash
   cd "C:\Users\RP\Desktop\1new app\Recordlane\frontend"
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Open your browser and go to:**
   ```
   http://localhost:5173
   ```

## ✅ Step 7: Test Functionality

1. **Check if the app loads without errors**
2. **Try creating a recording (if possible)**
3. **Check browser console for any errors**
4. **Verify that data is being saved to Supabase**

## 🔧 Troubleshooting

### If you get "Invalid API key" error:
- Double-check your Supabase URL and anon key
- Make sure there are no extra spaces or characters

### If you get "Table doesn't exist" error:
- Make sure you ran both migration scripts
- Check that the tables appear in the Table Editor

### If the app doesn't start:
- Make sure you're in the frontend directory
- Try running `npm install` first
- Check for any error messages in the terminal

### If you get CORS errors:
- Make sure your Supabase URL is correct
- Check that your domain is added to allowed origins in Supabase

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the terminal for error messages
3. Verify all steps in this checklist
4. Make sure your Supabase credentials are correct

## 🎉 Success!

Once you complete all steps, your RecordLane app will be running on Supabase with:
- ✅ Database tables created
- ✅ Environment variables configured
- ✅ Application running locally
- ✅ All functionality preserved

