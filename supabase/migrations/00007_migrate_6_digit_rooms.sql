-- 00007_migrate_6_digit_rooms.sql
-- Migrate SHAREBOX to support 6-digit numeric room codes and ensure active-room uniqueness

-- 1. Drop existing global unique constraint on rooms(code) if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_code_key'
  ) THEN
    ALTER TABLE rooms DROP CONSTRAINT rooms_code_key;
  END IF;
END $$;

-- 2. Create partial unique index on rooms(code) for active rooms
-- This prevents race conditions and collisions at the database level
-- while allowing codes of expired/deactivated rooms to be reused.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_active_code ON rooms(code) WHERE is_active = true;

-- 3. Add check constraint to ensure code is numeric and formatted properly (6 digits, or legacy 8 digits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_rooms_code_format'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT check_rooms_code_format CHECK (code ~ '^[0-9]{6}$' OR code ~ '^[0-9]{8}$');
  END IF;
END $$;

COMMENT ON TABLE rooms IS 'Stores 6-digit code-based temporary transfer rooms with 24-hour expiration';
