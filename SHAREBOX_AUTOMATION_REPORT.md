# SHAREBOX — Automated Supabase Provisioning & Integration Report

**Date of Execution**: November 19, 2026  
**Project Path**: `C:\studies\projects\sharebox`  
**Supabase Project**: `sharebox` (`dphmycuicaomrfhgzohs`)  
**Region**: `ap-south-1` (Mumbai)  
**Organization**: `sarvasri` (`pzupmsfxbgnhjjhwtpnv`)  
**Status**: 100% Fully Connected & Live Verified

---

## 1. Executive Summary

The complete automated provisioning, hardened security deployment, and live end-to-end integration of **SHAREBOX** has succeeded.

A dedicated Supabase project was created in the requested **Mumbai (`ap-south-1`)** region. All 6 versioned SQL migrations were deployed via Supabase CLI, Row Level Security policies were hardened against enumeration and data leakage, the private storage bucket was configured with Free Tier size safeguards (50 MB), and the application environment (`.env.local`) was populated. 

A live integration test was executed against `http://localhost:3000` and Supabase Storage, verifying two-participant room creation, room joining, multi-file uploads (PDF, JPEG, MP4), direct presigned PUT streaming, and byte-for-byte SHA-256 integrity verification upon download.

---

## 2. Supabase Infrastructure Provisioned

| Parameter | Configuration Value |
|---|---|
| **Project Name** | `sharebox` |
| **Project Reference** | `dphmycuicaomrfhgzohs` |
| **Organization** | `sarvasri` (`pzupmsfxbgnhjjhwtpnv`) |
| **Region** | `ap-south-1` (Mumbai, India) |
| **Project URL** | `https://dphmycuicaomrfhgzohs.supabase.co` |
| **Database Host** | `db.dphmycuicaomrfhgzohs.supabase.co` (PostgreSQL 17) |
| **Dashboard URL** | [supabase.com/dashboard/project/dphmycuicaomrfhgzohs](https://supabase.com/dashboard/project/dphmycuicaomrfhgzohs) |
| **CLI Status** | Successfully linked via `supabase link --project-ref dphmycuicaomrfhgzohs` |

---

## 3. Database Migrations & Tables Deployed

All migrations were applied to the remote database using `supabase db push --remote`:

1. `00001_create_rooms.sql`:
   - Table `rooms`: `id` (UUID PK), `code` (VARCHAR(8) UNIQUE), `created_at`, `expires_at`, `is_active`.
   - Indexes: `idx_rooms_code`, `idx_rooms_expires_at`, `idx_rooms_active`.
2. `00002_create_participants.sql`:
   - Table `participants`: `id` (UUID PK), `room_id` (FK rooms CASCADE), `display_name`, `session_token_hash`, `joined_at`, `is_active`.
   - Indexes: `idx_participants_room`, `idx_participants_session`, `idx_participants_active`.
3. `00003_create_files.sql`:
   - Table `files`: `id` (UUID PK), `room_id` (FK rooms CASCADE), `participant_id` (FK participants CASCADE), `original_name`, `sanitized_name`, `storage_path`, `mime_type`, `size`, `status`, `uploaded_at`.
   - Indexes: `idx_files_room`, `idx_files_participant`, `idx_files_status`, `idx_files_room_status`.
4. `00004_create_upload_sessions.sql`:
   - Table `upload_sessions`: `id` (UUID PK), `file_id` (FK files CASCADE), `room_id` (FK rooms CASCADE), `participant_id` (FK participants CASCADE), `upload_token`, `expires_at`, `created_at`.
   - Indexes: `idx_upload_sessions_token`, `idx_upload_sessions_file`, `idx_upload_sessions_expires_at`.
5. `00005_row_level_security.sql`:
   - Hardened RLS policies deployed across all 4 tables.
6. `00006_realtime.sql`:
   - Realtime publication configured: `ALTER PUBLICATION supabase_realtime ADD TABLE files;` and `participants;`.

---

## 4. RLS Security Hardening & Verification

### Vulnerabilities Fixed Before Deployment
1. **Room Enumeration**: Revoked public `SELECT` on `rooms`. Anonymous clients can no longer scrape or enumerate active 8-digit codes.
2. **Session Hijacking Defense**: Revoked public `SELECT` on `participants`. Session token hashes are strictly inaccessible to public / anonymous roles.
3. **File Metadata Protection**: Revoked public `SELECT` on `files` and `upload_sessions`. Metadata is accessible only through server-mediated API endpoints.

### Live Automated Verification
An unauthorized anonymous REST request was fired against `https://dphmycuicaomrfhgzohs.supabase.co/rest/v1/rooms?select=*`:
- **Result**: `The remote server returned an error: (401) Unauthorized.`
- **Defense Verified**: Direct table scraping by unauthorized clients is completely blocked.

---

## 5. Storage Bucket Configuration

- **Bucket Name**: `sharebox-files`
- **Visibility**: `private` (Direct public URL access disabled; requires server-generated signed URLs)
- **File Size Limit**: `52,428,800 bytes` (50 MB Free Tier limit, configurable up to 500 MB on Pro plans)
- **Allowed MIME Types**: `NULL` (Universal file transfer; accepts PDF, images, video, archives, binaries, etc.)
- **Status**: Verified active and accepting presigned uploads.

---

## 6. Environment Configuration

The local environment file [C:\studies\projects\sharebox\.env.local](file:///C:/studies/projects/sharebox/.env.local) was generated and verified:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dphmycuicaomrfhgzohs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (Retrieved via Supabase CLI)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (Retrieved via Supabase CLI)

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE_MB=50
MAX_FILES_PER_ROOM=50
CLEANUP_SECRET=sb_clean_8f9c1e7a4b2d6e3f5a0c8b7e
```

*(Note: `.env.local` is listed in `.gitignore` and is never committed to Git).*

---

## 7. Live End-to-End Integration Test Results

A full automated end-to-end integration test was executed via [scripts/test-e2e-live.mjs](file:///C:/studies/projects/sharebox/scripts/test-e2e-live.mjs) against the live Next.js server (`http://localhost:3000`) and the Supabase cloud infrastructure:

```text
====================================================
SHAREBOX LIVE SUPABASE END-TO-END INTEGRATION TEST
====================================================

--- 1. Testing Room Creation (Participant A) ---
[PASS] Room created successfully. Code: 14170968, ID: d8484581-2ab4-4c32-bb5e-395498250323
[PASS] Creator participant: Alice (Creator) (043023f2-1318-4a9b-9cf9-775a09eada63)

--- 2. Testing Room Joining (Participant B) ---
[PASS] Bob joined room 14170968 successfully.
[PASS] Joiner participant: Bob (Joiner) (1ce2172e-0da0-41b8-9d38-df501a29ae73)

--- 3. Testing Presigned Direct File Uploads ---
Uploading document_sample.pdf (289 bytes, application/pdf) as Alice...
  -> Obtained signed upload URL for path: rooms/.../document_sample.pdf
  -> Direct storage PUT completed (HTTP 200)
  -> Upload confirmed. File record ID: e1a052fb-ae44-4405-b354-15197527e644, Status: completed

Uploading photo_sample.jpg (4110 bytes, image/jpeg) as Bob...
  -> Obtained signed upload URL for path: rooms/.../photo_sample.jpg
  -> Direct storage PUT completed (HTTP 200)
  -> Upload confirmed. File record ID: 4ad43ab9-1ff2-4761-8415-529733a483a2, Status: completed

Uploading clip_sample.mp4 (16396 bytes, video/mp4) as Alice...
  -> Obtained signed upload URL for path: rooms/.../clip_sample.mp4
  -> Direct storage PUT completed (HTTP 200)
  -> Upload confirmed. File record ID: 9d710704-4455-4775-bb4f-558b900e68a1, Status: completed

--- 4. Testing File Downloads & SHA-256 Checksums ---
Downloading file document_sample.pdf as Bob...
  -> Signed download URL generated (expires in 5 min)
  -> Original size:   289 bytes   | Checksum: a4fffd06d1f287fcf5534e081ae79840a5f94e708f0387f1b28b280a6f0317ed
  -> Downloaded size: 289 bytes   | Checksum: a4fffd06d1f287fcf5534e081ae79840a5f94e708f0387f1b28b280a6f0317ed
  -> [VERIFIED MATCH] Exact byte-for-byte SHA-256 match!

Downloading file photo_sample.jpg as Bob...
  -> Signed download URL generated (expires in 5 min)
  -> Original size:   4110 bytes  | Checksum: 046c3a258bfcf35df7a2e95f4d978585004dcb18c39ab87889cbc91b48a91c0e
  -> Downloaded size: 4110 bytes  | Checksum: 046c3a258bfcf35df7a2e95f4d978585004dcb18c39ab87889cbc91b48a91c0e
  -> [VERIFIED MATCH] Exact byte-for-byte SHA-256 match!

Downloading file clip_sample.mp4 as Bob...
  -> Signed download URL generated (expires in 5 min)
  -> Original size:   16396 bytes | Checksum: b03a6244056242e08c17b4bf4a7268e41a1f75e1918acdece78c348e8ba1ba4f
  -> Downloaded size: 16396 bytes | Checksum: b03a6244056242e08c17b4bf4a7268e41a1f75e1918acdece78c348e8ba1ba4f
  -> [VERIFIED MATCH] Exact byte-for-byte SHA-256 match!

--- 5. Testing Download-All Endpoint ---
[PASS] Download-All returned 3 signed file URLs for room 14170968.

--- 6. Testing Security: Unauthorized Access Prevention ---
[PASS] Unauthorized request rejected with HTTP 401 Unauthorized.

--- 7. Testing Room Details Endpoint ---
[PASS] Room 14170968 contains 3 active files in metadata.

====================================================
ALL LIVE INTEGRATION TESTS PASSED CLEANLY (100%)
====================================================
```

---

## 8. Cleanup Automation

- Production cron job definition was created in [vercel.json](file:///C:/studies/projects/sharebox/vercel.json):
  ```json
  {
    "crons": [
      {
        "path": "/api/cleanup",
        "schedule": "0 * * * *"
      }
    ]
  }
  ```
- Tested invocation of `/api/cleanup` with `Bearer <CLEANUP_SECRET>`:
  - **Response**: `{"success": true, "cleanedRooms": 0, "deletedFiles": 0}` (HTTP 200 OK).

---

## 9. Verification Summary

- **Jest Unit Test Suite**: `PASS` (24/24 tests passed).
- **TypeScript Typecheck**: `0 errors` (`tsc --noEmit`).
- **Live Next.js Server**: Running on `http://localhost:3000` with live Supabase database and storage.
- **Remaining Manual Actions**: **None**. SHAREBOX is fully operational and ready for use.
