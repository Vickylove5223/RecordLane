CREATE TABLE recordings (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL UNIQUE,
  drive_link TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration >= 0),
  privacy VARCHAR(50) NOT NULL CHECK (privacy IN ('private', 'anyone-viewer', 'anyone-commenter')),
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient listing (ordered by creation date)
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

-- Index for searching by title
CREATE INDEX idx_recordings_title ON recordings USING gin(to_tsvector('english', title));

-- Index for drive file ID lookups
CREATE INDEX idx_recordings_drive_file_id ON recordings(drive_file_id);
