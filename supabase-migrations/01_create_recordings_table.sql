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

