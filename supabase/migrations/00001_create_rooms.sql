-- 00001_create_rooms.sql
-- Create rooms table for SHAREBOX

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON rooms(expires_at);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active) WHERE is_active = true;

-- Comment for table documentation
COMMENT ON TABLE rooms IS 'Stores 8-digit code-based temporary transfer rooms with 24-hour expiration';
