-- all_migrations.sql
-- Consolidated schema, RLS, Realtime, and Storage setup for SHAREBOX
-- Run this in the Supabase SQL Editor to set up the entire database in one click.

-- ========================================================
-- 1. EXTENSIONS
-- ========================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 2. TABLES
-- ========================================================

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active) WHERE is_active = true;

-- Participants
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  session_token_hash VARCHAR(64) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_participants_active ON participants(room_id, is_active) WHERE is_active = true;

-- Files
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

CREATE INDEX IF NOT EXISTS idx_files_room ON files(room_id);
CREATE INDEX IF NOT EXISTS idx_files_participant ON files(participant_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_room_status ON files(room_id, status);

-- Upload Sessions
CREATE TABLE IF NOT EXISTS upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  upload_token VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON upload_sessions(upload_token);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_file ON upload_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);

-- ========================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- Allow reading active, unexpired rooms
CREATE POLICY "Allow public read access to active rooms"
  ON rooms FOR SELECT TO anon, authenticated
  USING (is_active = true AND expires_at > now());

-- Allow reading participants in active, unexpired rooms
CREATE POLICY "Allow public read access to participants in active rooms"
  ON participants FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = participants.room_id
        AND rooms.is_active = true
        AND rooms.expires_at > now()
    )
  );

-- Allow reading completed files in active, unexpired rooms
CREATE POLICY "Allow public read access to completed files in active rooms"
  ON files FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = files.room_id
        AND rooms.is_active = true
        AND rooms.expires_at > now()
    )
  );

-- Grant select to anon/authenticated
GRANT SELECT ON rooms TO anon, authenticated;
GRANT SELECT ON participants TO anon, authenticated;
GRANT SELECT ON files TO anon, authenticated;

-- ========================================================
-- 4. REALTIME PUBLICATION
-- ========================================================
ALTER TABLE files REPLICA IDENTITY FULL;
ALTER TABLE participants REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'files'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE files;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participants;
  END IF;
END $$;

-- ========================================================
-- 5. STORAGE BUCKET
-- ========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sharebox-files',
  'sharebox-files',
  false,
  524288000,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 524288000,
  allowed_mime_types = NULL;
