-- 00005_row_level_security.sql
-- Hardened Row Level Security (RLS) policies for SHAREBOX
-- Prevents room enumeration, session token leakage, and unauthorized metadata access.

-- 1. Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all default public permissions
REVOKE ALL ON rooms FROM anon, authenticated;
REVOKE ALL ON participants FROM anon, authenticated;
REVOKE ALL ON files FROM anon, authenticated;
REVOKE ALL ON upload_sessions FROM anon, authenticated;

-- 3. Strict RLS Policies
-- All database writes, room queries, authentication checks, and file operations
-- are strictly handled through server-side Next.js route handlers utilizing the service_role key.
-- Direct table access by anon or public clients is strictly prohibited to prevent:
--   a) Room enumeration (scraping active 8-digit room codes)
--   b) Participant token hash exposure (session hijacking)
--   c) Global file metadata and storage path harvesting

-- Allow authenticated service_role full access (inherent in Supabase service_role, explicit for clarity)
-- Anon clients interacting with Realtime Broadcast and Presence use WebSocket channels (room:<id>),
-- which operate independently of table SELECT permissions.

COMMENT ON TABLE rooms IS 'SHAREBOX rooms protected by server-side mediation and strict RLS.';
COMMENT ON TABLE participants IS 'Participant sessions are private. Hashes are never exposed to clients.';
COMMENT ON TABLE files IS 'File records are private. Access is authorized via server-generated signed URLs.';
COMMENT ON TABLE upload_sessions IS 'Upload sessions are strictly private to the server.';
