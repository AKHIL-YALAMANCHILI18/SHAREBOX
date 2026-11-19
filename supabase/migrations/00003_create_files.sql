-- 00003_create_files.sql
-- Create files table for SHAREBOX

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  sanitized_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(127) NOT NULL DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'completed', 'failed')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for querying room files and status
CREATE INDEX IF NOT EXISTS idx_files_room ON files(room_id);
CREATE INDEX IF NOT EXISTS idx_files_participant ON files(participant_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_room_status ON files(room_id, status);

COMMENT ON TABLE files IS 'Metadata for all uploaded files transferred inside rooms';
