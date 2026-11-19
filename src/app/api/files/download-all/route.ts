import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStorageAdapter } from '@/lib/storage/supabase-storage';
import { authenticateParticipant } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { RATE_LIMITS } from '@/lib/constants';
import type { ApiError } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`download_all:${ip}`, RATE_LIMITS.downloadFile);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Download limit reached. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // 2. Parse request body
    let roomCode = '';
    try {
      const body = await request.json();
      roomCode = body.roomCode;
    } catch {
      const url = new URL(request.url);
      roomCode = url.searchParams.get('roomCode') || '';
    }

    if (!roomCode || !/^\d{8}$/.test(roomCode)) {
      return NextResponse.json<ApiError>(
        { error: 'Valid 8-digit roomCode is required.' },
        { status: 400 }
      );
    }

    // 3. Authenticate participant
    const auth = await authenticateParticipant(request, roomCode);
    if (!auth) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized or room session has expired.' },
        { status: 401 }
      );
    }

    const { room } = auth;
    const supabase = getSupabaseAdmin();

    // 4. Fetch all completed files in this room
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('id, original_name, sanitized_name, storage_path, mime_type, size')
      .eq('room_id', room.id)
      .eq('status', 'completed');

    if (filesError) {
      console.error('Error fetching room files for download-all:', filesError);
      return NextResponse.json<ApiError>({ error: 'Failed to fetch files' }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ files: [] });
    }

    // 5. Generate signed download URLs in parallel
    const storage = getStorageAdapter();
    const downloadList = await Promise.all(
      files.map(async (file) => {
        try {
          const url = await storage.createSignedDownloadUrl(file.storage_path, 600); // 10 minutes
          return {
            id: file.id,
            name: file.original_name,
            size: Number(file.size),
            mimeType: file.mime_type,
            url,
          };
        } catch (err) {
          console.warn(`Failed to generate signed download URL for file ${file.id}:`, err);
          return null;
        }
      })
    );

    const validDownloads = downloadList.filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      roomCode: room.code,
      files: validDownloads,
      count: validDownloads.length,
    });
  } catch (err) {
    console.error('Unhandled error in POST /api/files/download-all:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while preparing files for download.' },
      { status: 500 }
    );
  }
}
