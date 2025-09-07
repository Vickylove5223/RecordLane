-- Create recordings table
CREATE TABLE recordings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(255) NOT NULL UNIQUE,
  youtube_link TEXT NOT NULL,
  duration INTEGER NOT NULL,
  privacy VARCHAR(50) NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  session_id VARCHAR(255),
  user_agent TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
