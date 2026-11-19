import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStorageAdapter } from '@/lib/storage/supabase-storage';
import { authenticateParticipant } from '@/lib/security/auth';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { RATE_LIMITS } from '@/lib/constants';
import type { ApiError } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 1. Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`download:${ip}`, RATE_LIMITS.downloadFile);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Download rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch file record and its room
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, rooms(*)')
      .eq('id', id)
      .single();

    if (fileError || !file || !file.rooms) {
      return NextResponse.json<ApiError>({ error: 'File not found' }, { status: 404 });
    }

    const room = file.rooms;

    // 3. Verify room is active and not expired
    if (!room.is_active || new Date(room.expires_at).getTime() <= Date.now()) {
      return NextResponse.json<ApiError>(
        { error: 'Room has expired. File is no longer available.' },
        { status: 410 }
      );
    }

    // 4. Authenticate participant
    const auth = await authenticateParticipant(request, room.code);
    if (!auth || auth.room.id !== room.id) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized to download this file.' },
        { status: 401 }
      );
    }

    // 5. Generate signed download URL (5 minutes validity)
    const storage = getStorageAdapter();
    const downloadUrl = await storage.createSignedDownloadUrl(file.storage_path, 300);

    const url = new URL(request.url);
    if (url.searchParams.get('redirect') === 'true') {
      return NextResponse.redirect(downloadUrl);
    }

    return NextResponse.json({
      downloadUrl,
      fileName: file.original_name,
      mimeType: file.mime_type,
      size: Number(file.size),
    });
  } catch (err) {
    console.error('Unhandled error in GET /api/files/[id]:', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to generate download link.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = getSupabaseAdmin();

    // 1. Fetch file record and room
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, rooms(*)')
      .eq('id', id)
      .single();

    if (fileError || !file || !file.rooms) {
      return NextResponse.json<ApiError>({ error: 'File not found' }, { status: 404 });
    }

    const room = file.rooms;

    // 2. Authenticate participant
    const auth = await authenticateParticipant(request, room.code);
    if (!auth || auth.room.id !== room.id) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized to delete this file.' },
        { status: 401 }
      );
    }

    // 3. Delete from storage
    const storage = getStorageAdapter();
    try {
      await storage.deleteFile(file.storage_path);
    } catch (storageErr) {
      console.warn('Storage file deletion error (continuing DB removal):', storageErr);
    }

    // 4. Delete file record from database (cascade deletes upload_sessions)
    const { error: dbDeleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (dbDeleteError) {
      console.error('Database file delete error:', dbDeleteError);
      return NextResponse.json<ApiError>({ error: 'Failed to delete file record' }, { status: 500 });
    }

    // 5. Broadcast realtime file deletion
    try {
      const channel = supabase.channel(`room:${room.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'file_deleted',
        payload: { fileId: id },
      });
      supabase.removeChannel(channel);
    } catch (rtErr) {
      console.warn('Realtime broadcast error on delete:', rtErr);
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (err) {
    console.error('Unhandled error in DELETE /api/files/[id]:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while deleting the file.' },
      { status: 500 }
    );
  }
}
