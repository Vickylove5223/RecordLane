CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  recording_id VARCHAR(255),
  session_id VARCHAR(255),
  user_agent TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by event type
CREATE INDEX idx_events_event_type ON events(event_type);

-- Index for date-based queries
CREATE INDEX idx_events_created_at ON events(created_at DESC);

-- Index for session-based analytics
CREATE INDEX idx_events_session_id ON events(session_id) WHERE session_id IS NOT NULL;

-- Index for recording-specific events
CREATE INDEX idx_events_recording_id ON events(recording_id) WHERE recording_id IS NOT NULL;

-- Composite index for analytics queries
CREATE INDEX idx_events_type_date ON events(event_type, created_at DESC);
