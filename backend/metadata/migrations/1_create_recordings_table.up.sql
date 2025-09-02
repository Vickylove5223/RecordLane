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

-- Index for efficient listing (ordered by creation date)
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

-- Index for searching by title
CREATE INDEX idx_recordings_title ON recordings USING gin(to_tsvector('english', title));

-- Index for youtube video ID lookups
CREATE INDEX idx_recordings_youtube_video_id ON recordings(youtube_video_id);
