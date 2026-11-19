-- 00005_row_level_security.sql
-- Row Level Security (RLS) policies for SHAREBOX

-- 1. Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Rooms policies
-- Allow anonymous users to view active, non-expired rooms by code/id
CREATE POLICY "Allow public read access to active rooms"
  ON rooms
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true 
    AND expires_at > now()
  );

-- 3. Participants policies
-- Allow reading participant public metadata (display names) for active non-expired rooms
CREATE POLICY "Allow public read access to participants in active rooms"
  ON participants
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = participants.room_id
        AND rooms.is_active = true
        AND rooms.expires_at > now()
    )
  );

-- 4. Files policies
-- Allow reading files metadata in active non-expired rooms
CREATE POLICY "Allow public read access to completed files in active rooms"
  ON files
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = files.room_id
        AND rooms.is_active = true
        AND rooms.expires_at > now()
    )
  );

-- 5. Upload Sessions policies
-- Strictly restricted - no direct public read or write access
-- Managed purely through service-role backend handlers

-- Grant necessary read permissions to anon and authenticated roles
GRANT SELECT ON rooms TO anon, authenticated;
GRANT SELECT ON participants TO anon, authenticated;
GRANT SELECT ON files TO anon, authenticated;
