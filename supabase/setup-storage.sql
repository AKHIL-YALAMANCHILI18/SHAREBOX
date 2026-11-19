-- setup-storage.sql
-- Storage bucket initialization and configuration for SHAREBOX

-- 1. Create the private storage bucket 'sharebox-files' if it does not exist
-- max_file_size: 52428800 bytes (50 MB default for Supabase Free Tier compatibility)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sharebox-files',
  'sharebox-files',
  false,               -- Private bucket: downloads require signed URLs
  52428800,            -- 50 MB Free Tier limit (configurable to 500 MB on Pro)
  NULL                 -- Universal transfer: all MIME types permitted
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = NULL;

-- 2. Storage Policies
-- Direct bucket access is blocked for public/anon.
-- Uploads and downloads are mediated via server-generated signed URLs using the service role key.
-- This ensures strict authorization, token validation, rate-limiting, and room-membership checks.

COMMENT ON TABLE storage.objects IS 'SHAREBOX storage objects are protected. Access requires time-limited signed URLs.';
