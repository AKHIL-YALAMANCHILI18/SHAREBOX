-- 00002_create_participants.sql
-- Create participants table for SHAREBOX

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name VARCHAR(50) NOT NULL,
  session_token_hash VARCHAR(64) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for room lookups and session verification
CREATE INDEX IF NOT EXISTS idx_participants_room ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_participants_active ON participants(room_id, is_active) WHERE is_active = true;

COMMENT ON TABLE participants IS 'Tracks room participants and their hashed session tokens';
