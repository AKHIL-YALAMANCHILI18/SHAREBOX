import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStorageAdapter } from '@/lib/storage/supabase-storage';
import { authenticateParticipant } from '@/lib/security/auth';
import { sanitizeFilename, validateFileSize, validateMimeType } from '@/lib/security/sanitize';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { generateId } from '@/lib/security/hash';
import { generateSessionToken } from '@/lib/security/session';
import { RATE_LIMITS, MAX_FILE_SIZE, MAX_FILES_PER_ROOM } from '@/lib/constants';
import type { UploadInitRequest, UploadInitResponse, FileRecord, ApiError } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`upload_init:${ip}`, RATE_LIMITS.uploadFile);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Too many upload requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // 2. Parse request URL and body
    const url = new URL(request.url);
    let body: (UploadInitRequest & { roomCode?: string }) | null = null;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiError>({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const roomCode = url.searchParams.get('roomCode') || body?.roomCode;
    if (!roomCode || !/^\d{8}$/.test(roomCode)) {
      return NextResponse.json<ApiError>(
        { error: 'A valid 8-digit roomCode is required.' },
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

    const { participant, room } = auth;

    // 4. Validate file parameters
    if (!body) {
      return NextResponse.json<ApiError>({ error: 'Missing request body' }, { status: 400 });
    }

    const { fileName, fileSize, mimeType } = body;
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json<ApiError>({ error: 'Valid fileName is required' }, { status: 400 });
    }

    if (!validateFileSize(fileSize, MAX_FILE_SIZE)) {
      return NextResponse.json<ApiError>(
        { error: `File size must be between 1 byte and ${MAX_FILE_SIZE / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeFilename(fileName);
    const validatedMime = validateMimeType(mimeType || 'application/octet-stream');

    const supabase = getSupabaseAdmin();

    // 5. Check room file limit
    const { count, error: countError } = await supabase
      .from('files')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .neq('status', 'failed');

    if (countError) {
      console.error('Error checking file count:', countError);
    } else if (count !== null && count >= MAX_FILES_PER_ROOM) {
      return NextResponse.json<ApiError>(
        { error: `Room file limit of ${MAX_FILES_PER_ROOM} files reached.` },
        { status: 400 }
      );
    }

    // 6. Generate IDs and storage path
    const fileId = generateId();
    const storagePath = `rooms/${room.id}/${fileId}/${sanitizedName}`;

    // 7. Insert file record into database
    const { data: fileRecord, error: fileInsertError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        room_id: room.id,
        participant_id: participant.id,
        original_name: fileName,
        sanitized_name: sanitizedName,
        storage_path: storagePath,
        mime_type: validatedMime,
        size: fileSize,
        status: 'pending',
      })
      .select()
      .single();

    if (fileInsertError || !fileRecord) {
      console.error('Database file insert error:', fileInsertError);
      return NextResponse.json<ApiError>(
        { error: 'Failed to record file in database' },
        { status: 500 }
      );
    }

    // 8. Generate signed upload URL from storage adapter
    const storage = getStorageAdapter();
    const uploadResult = await storage.createSignedUploadUrl(storagePath);

    // 9. Create upload session record
    const uploadToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase.from('upload_sessions').insert({
      file_id: fileId,
      room_id: room.id,
      participant_id: participant.id,
      upload_token: uploadToken,
      expires_at: sessionExpiresAt,
    });

    const filePayload: FileRecord = {
      id: fileRecord.id,
      room_id: fileRecord.room_id,
      participant_id: fileRecord.participant_id,
      original_name: fileRecord.original_name,
      sanitized_name: fileRecord.sanitized_name,
      storage_path: fileRecord.storage_path,
      mime_type: fileRecord.mime_type,
      size: Number(fileRecord.size),
      status: fileRecord.status,
      uploaded_at: fileRecord.uploaded_at,
      uploader_name: participant.display_name,
    };

    const responsePayload: UploadInitResponse = {
      file: filePayload,
      signedUrl: uploadResult.signedUrl,
      token: uploadResult.token,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err) {
    console.error('Unhandled error in POST /api/files:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while initiating upload.' },
      { status: 500 }
    );
  }
}
