-- Create recordings table
CREATE TABLE recordings (
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
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  session_id VARCHAR(255),
  user_agent TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for recordings
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);
CREATE INDEX idx_recordings_youtube_video_id ON recordings(youtube_video_id);

-- Create indexes for events
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_events_recording_id ON events(recording_id) WHERE recording_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for recordings
CREATE POLICY "Public read access" ON recordings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert" ON recordings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for events
CREATE POLICY "Public insert access for analytics" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');
