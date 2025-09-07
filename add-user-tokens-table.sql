-- Add user tokens table for persistent YouTube authentication
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Device ID or user identifier
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for user_tokens
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tokens
CREATE POLICY "Users can manage their own tokens" ON user_tokens
  FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = 'anonymous');

-- Add updated_at trigger for user_tokens
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to user_tokens table
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at
    BEFORE UPDATE ON user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
