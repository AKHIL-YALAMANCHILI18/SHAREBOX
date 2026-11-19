-- 00004_create_upload_sessions.sql
-- Create upload_sessions table for SHAREBOX

CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  upload_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for token validation and cleanup
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON upload_sessions(upload_token);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_file ON upload_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);

COMMENT ON TABLE upload_sessions IS 'Tracks short-lived upload sessions and authorization tokens';
