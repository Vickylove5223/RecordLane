-- Add RLS policies to existing tables
-- This script only adds policies, assuming tables already exist

-- Enable Row Level Security on existing tables
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for recordings
CREATE POLICY "Public read access" ON recordings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert" ON recordings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own recordings" ON recordings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own recordings" ON recordings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for events
CREATE POLICY "Public insert access for analytics" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add updated_at trigger for recordings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to recordings table
DROP TRIGGER IF EXISTS update_recordings_updated_at ON recordings;
CREATE TRIGGER update_recordings_updated_at
    BEFORE UPDATE ON recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
