# SHAREBOX — Technical Audit Report

**Generated**: November 19, 2026  
**Status**: Comprehensive Independent Technical Audit  
**Location**: `C:\studies\projects\sharebox`

---

## 1. Verified Features

- **Frontend Design System**: Minimalist SaaS UI styled with Tailwind CSS (`#FAFAFA` background, `#FFFFFF` surface, `#18181B` text, `#6366F1` indigo accents, `#16A34A` / `#DC2626` alerts).
- **Client Components**: All UI atoms (`Button`, `Input`, `Card`, `Badge`, `Progress`, `Spinner`, `CopyButton`) pass isolated unit tests and render correctly.
- **Landing Page Interface**: Immediately visible Create Room & Join Room cards, How-it-Works guide, feature breakdown, and footer.
- **Unit Test Suite (24 tests)**: 24 Jest tests passing across utility functions, formatting helpers, and UI component rendering.
- **Static Compilation & Build**: Next.js 15 App Router compiles with 0 TypeScript errors and produces production bundles for all routes.

---

## 2. Failed Tests & Unverified Features

- **Live HTTP Endpoint Testing**: Calling `POST http://localhost:3000/api/rooms` fails with **HTTP 500** (`{"error":"An unexpected error occurred while creating the room."}`) because no database credentials are configured.
- **Live Database Integration**: Unverified. No database instance is connected.
- **Live Storage Upload/Download**: Unverified. No files have been uploaded to or downloaded from cloud storage.
- **Cross-Network Multi-Device Sync**: Unverified. No tests have been conducted across different machines or network environments.
- **Resumable / Chunked Upload Recovery**: Unimplemented. Interrupted uploads do not resume; they restart from byte 0.
- **File Integrity Verification**: Unimplemented. No SHA-256 hash or checksum is computed before or after file transfer.

---

## 3. Security Vulnerabilities

### Severity: High — Information Disclosure & Room Enumeration via RLS
In `supabase/migrations/00005_row_level_security.sql` and `supabase/all_migrations.sql`:
1. **Public Room Enumeration**:
   ```sql
   CREATE POLICY "Allow public read access to active rooms"
     ON rooms FOR SELECT TO anon, authenticated
     USING (is_active = true AND expires_at > now());
   ```
   *Vulnerability*: Allows any user with the public anonymous Supabase key to query `rooms` and list every active 8-digit room code in the system.
2. **Participant Session Hash Exposure**:
   ```sql
   CREATE POLICY "Allow public read access to participants in active rooms"
     ON participants FOR SELECT TO anon, authenticated
     USING (...);
   ```
   *Vulnerability*: Allows anonymous users to dump `session_token_hash` values for all participants across all active rooms.
3. **Global File Metadata Disclosure**:
   ```sql
   CREATE POLICY "Allow public read access to completed files in active rooms"
     ON files FOR SELECT TO anon, authenticated
     USING (...);
   ```
   *Vulnerability*: Allows anonymous users to dump file names, file sizes, and storage paths for all files across all rooms without knowing the room code.

### Severity: Medium — In-Memory Rate Limiting in Serverless Environments
In `src/lib/security/rate-limit.ts`:
- Rate limiting uses an in-memory `Map`. On serverless platforms (such as Vercel), instances are ephemeral and memory is not shared across lambda containers, enabling attackers to bypass limits.

---

## 4. Database Inconsistencies

- **Room Code Hashing**: The original directive specified "Secure hashed room codes." In the actual schema (`rooms` table), `code` is stored as plaintext `VARCHAR(8)`. Lookups in `/api/rooms/[code]` and `/api/rooms/[code]/join` are performed directly against plaintext codes.

---

## 5. Missing Configurations

1. **Environment File (`.env.local`)**: No configuration file exists in the repository.
   - Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Automated Cleanup Trigger**: No cron job configuration (e.g. `vercel.json` or external trigger) exists to automatically call `/api/cleanup`.

---

## 6. Storage Limitations

- The code and setup scripts configure a 500 MB limit (`MAX_FILE_SIZE_MB=500`, `file_size_limit = 524288000`).
- **Supabase Free Tier Limit**: Supabase enforces a strict **50 MB file size limit** on its free tier. Uploading files greater than 50 MB will fail unless upgraded to a paid Supabase Pro plan ($25/mo) or connected to an S3/R2 storage adapter.

---

## 7. Required Fixes Ranked by Severity

| Rank | Severity | Issue | Required Action |
|---|---|---|---|
| **1** | **High** | Insecure RLS policies exposing room codes, token hashes, and files | Revoke public `SELECT` on `rooms`, `participants`, and `files` for `anon`. Route operations through backend API routes using service-role. |
| **2** | **High** | Missing backend credentials causing HTTP 500 errors | Create `.env.local` with real Supabase project URL and service-role keys. |
| **3** | **Medium** | Migrations unexecuted on database | Run `all_migrations.sql` in Supabase SQL Editor. |
| **4** | **Medium** | In-memory rate limiting not serverless-compatible | Integrate Upstash Redis or database-backed rate limiting for production. |
| **5** | **Low** | 500 MB vs 50 MB Free Tier mismatch | Adjust default `MAX_FILE_SIZE_MB` to 50 MB or document Supabase Pro requirement. |
| **6** | **Low** | Missing scheduled cleanup cron | Add `vercel.json` with a daily cron trigger for `/api/cleanup`. |

---

## 8. Exact Files Requiring Modification

1. [supabase/migrations/00005_row_level_security.sql](file:///C:/studies/projects/sharebox/supabase/migrations/00005_row_level_security.sql)
2. [supabase/all_migrations.sql](file:///C:/studies/projects/sharebox/supabase/all_migrations.sql)
3. [.env.local](file:///C:/studies/projects/sharebox/.env.local) *(To be created)*
4. [src/lib/security/rate-limit.ts](file:///C:/studies/projects/sharebox/src/lib/security/rate-limit.ts)
5. [vercel.json](file:///C:/studies/projects/sharebox/vercel.json) *(To be created)*
