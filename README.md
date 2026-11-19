# SHAREBOX — Transfer anything. Anywhere.

> A universal, privacy-first, code-based file transfer platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase.

---

## Overview

SHAREBOX provides effortless peer-to-peer style file exchange between any two devices without mandatory accounts, software installation, or file format limitations. 

### Core Experience
1. **Create a room**: Click "Create Room" to generate a secure, unique 8-digit numeric code.
2. **Upload files**: Drag and drop any file (videos, code, executables, archives, spreadsheets, documents).
3. **Share code**: Share the 8-digit code or direct invitation link with your peer.
4. **Instant sync**: Both participants can upload and download simultaneously in real time.
5. **24-hour expiration**: The room, database records, and stored files are automatically purged after 24 hours.

---

## Design System

Designed as a minimalist SaaS interface using:
- **Background**: `#FAFAFA`
- **Surface**: `#FFFFFF`
- **Primary Text**: `#18181B`
- **Secondary Text**: `#71717A`
- **Borders**: `#E4E4E7`
- **Accent**: `#6366F1` (Indigo)
- **Success**: `#16A34A` (Emerald)
- **Error**: `#DC2626` (Red)

---

## Architecture & Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Turbopack / Webpack, React 19) |
| **Language** | TypeScript (strict mode, zero type errors) |
| **Styling** | Tailwind CSS v3 with customized SaaS design tokens |
| **Icons** | Lucide React |
| **Database** | PostgreSQL via Supabase (UUID PKs, Cascading FKs, RLS) |
| **Storage** | Supabase Storage (Private bucket `sharebox-files`, direct signed URLs) |
| **Realtime** | Supabase Realtime (WebSocket channels, presence tracking, broadcast events) |
| **Testing** | Jest, ts-jest, React Testing Library |
| **Deployment** | Vercel (Edge / Serverless Node.js runtime) |

---

## Security Implementation

- **Private Storage Buckets**: Uploaded files are stored in a private bucket. Direct public access is disabled.
- **Short-Lived Signed URLs**: Downloads use time-limited (5-minute expiry) HMAC-signed URLs generated server-side.
- **Hashed Session Tokens**: Participant sessions use 256-bit cryptographically random tokens stored as SHA-256 hashes in PostgreSQL and transmitted in `httpOnly`, `SameSite=Lax` cookies.
- **Path Traversal & Injection Prevention**: All filenames undergo sanitization stripping null bytes, path traversal sequences (`../`, `..\`), and dangerous characters.
- **Rate Limiting**: Sliding-window rate limiters protect room creation (5/min), joining (10/min), upload initialization (20/min), and downloads (30/min).
- **Zero In-Memory File Buffering**: Uploads go directly from the client browser to cloud storage via pre-signed PUT URLs, avoiding server memory bottlenecks.
- **Idempotent 24h Cleanup**: Scheduled cleanup endpoint purges storage objects and database records for expired rooms.

---

## Project Structure

```
sharebox/
├── __tests__/                      # Automated test suite (24 tests)
│   ├── api.test.ts                 # Rate limiting, security & validation tests
│   ├── components.test.tsx         # UI component unit tests
│   └── utils.test.ts               # File formatting & sanitization tests
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cleanup/route.ts    # Expired room & file purge endpoint
│   │   │   ├── files/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── confirm/route.ts # Confirm upload completion
│   │   │   │   │   └── route.ts    # Signed download URL & file deletion
│   │   │   │   ├── download-all/route.ts # Batch download URLs
│   │   │   │   └── route.ts        # Direct upload initialization & presigned URL
│   │   │   └── rooms/
│   │   │       ├── [code]/
│   │   │       │   ├── join/route.ts # Join existing room
│   │   │       │   ├── leave/route.ts # Leave room session
│   │   │       │   └── route.ts    # Room status & file list
│   │   │       └── route.ts        # Create 8-digit room
│   │   ├── globals.css             # Tailwind base & custom styles
│   │   ├── layout.tsx              # Root HTML shell & metadata
│   │   ├── not-found.tsx           # 404 handler
│   │   ├── page.tsx                # Landing page
│   │   └── room/[code]/page.tsx    # Live room server component
│   ├── components/
│   │   ├── landing/                # Hero, Features, How-it-works, Header, Footer
│   │   ├── room/                   # Header, UploadZone, FileList, FileItem, Presence
│   │   └── ui/                     # Button, Input, Card, Badge, Progress, Spinner
│   ├── hooks/                      # useRealtime, useFileUpload, useCountdown, useRoom
│   ├── lib/
│   │   ├── security/               # Hash, auth, rate-limit, sanitize, session
│   │   ├── storage/                # Modular storage adapter (Supabase / S3 ready)
│   │   ├── supabase/               # Client, server, and service-role admin clients
│   │   ├── constants.ts            # Configuration constants & defaults
│   │   └── utils.ts                # Formatting & category helpers
│   └── types/                      # Domain interfaces & API types
├── supabase/
│   ├── migrations/                 # PostgreSQL migrations (00001 - 00006)
│   ├── all_migrations.sql          # Unified migration script
│   └── setup-storage.sql           # Storage bucket setup script
├── jest.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone & Install Dependencies
```bash
cd sharebox
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
MAX_FILE_SIZE_MB=500
MAX_FILES_PER_ROOM=50
CLEANUP_SECRET=your-secure-cron-secret
```

### 3. Apply Database Migrations
Run the SQL script `supabase/all_migrations.sql` in your Supabase SQL Editor:
- Creates `rooms`, `participants`, `files`, and `upload_sessions` tables.
- Applies Row Level Security (RLS) policies.
- Enables Realtime publications for instant peer synchronization.
- Creates the `sharebox-files` private storage bucket.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to start sharing files.

---

## Automated Testing

Run the full automated test suite:
```bash
npm test
```
Typecheck the codebase:
```bash
npm run typecheck
```
Build for production:
```bash
npm run build
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set Environment Variables in Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
   - `MAX_FILE_SIZE_MB`
   - `MAX_FILES_PER_ROOM`
   - `CLEANUP_SECRET`
4. Deploy!

### Setting Up 24h Scheduled Cleanup
To trigger cleanup of expired rooms, configure a cron job (via Vercel Cron or GitHub Actions):
```bash
curl -X POST https://your-domain.com/api/cleanup \
  -H "Authorization: Bearer your-secure-cron-secret"
```

---

## License
MIT License.
