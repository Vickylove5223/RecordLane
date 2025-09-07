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

-- Create indexes for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_title ON recordings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recordings_youtube_video_id ON recordings(youtube_video_id);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_recording_id ON events(recording_id) WHERE recording_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_type_date ON events(event_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for recordings (using DO block to check existence first)
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Public read access" ON recordings;
  DROP POLICY IF EXISTS "Authenticated users can insert" ON recordings;
  DROP POLICY IF EXISTS "Users can update their own recordings" ON recordings;
  DROP POLICY IF EXISTS "Users can delete their own recordings" ON recordings;
  
  -- Create policies for recordings
  CREATE POLICY "Public read access" ON recordings
    FOR SELECT USING (true);

  CREATE POLICY "Authenticated users can insert" ON recordings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Users can update their own recordings" ON recordings
    FOR UPDATE USING (auth.role() = 'authenticated');

  CREATE POLICY "Users can delete their own recordings" ON recordings
    FOR DELETE USING (auth.role() = 'authenticated');
END $$;

-- Create policies for events (using DO block to check existence first)
DO $$
BEGIN
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Public insert access for analytics" ON events;
  DROP POLICY IF EXISTS "Authenticated users can read events" ON events;
  
  -- Create policies for events
  CREATE POLICY "Public insert access for analytics" ON events
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "Authenticated users can read events" ON events
    FOR SELECT USING (auth.role() = 'authenticated');
END $$;
