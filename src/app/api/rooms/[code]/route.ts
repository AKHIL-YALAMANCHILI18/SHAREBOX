import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSessionToken, hashSessionToken } from '@/lib/security/session';
import type { Room, FileRecord, ApiError } from '@/types';

interface RouteParams {
  params: Promise<{
    code: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    // 1. Validate room code format (6 digits, supporting legacy 8 digits)
    if (!code || !/^\d{6,8}$/.test(code)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid room code format. Expected 6 digits.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch room record
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      return NextResponse.json<ApiError>(
        { error: 'Room not found or no longer active' },
        { status: 404 }
      );
    }

    // 3. Check expiration
    if (new Date(room.expires_at).getTime() <= Date.now()) {
      return NextResponse.json<ApiError>(
        { error: 'This room has expired' },
        { status: 410 }
      );
    }

    // 4. Check if requesting user has an active participant session
    let currentParticipant = null;
    const sessionToken = await getSessionToken(code);
    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);
      const { data: part } = await supabase
        .from('participants')
        .select('id, display_name, is_active')
        .eq('room_id', room.id)
        .eq('session_token_hash', tokenHash)
        .eq('is_active', true)
        .single();

      if (part) {
        currentParticipant = part;
      }
    }

    // 5. Fetch completed files for this room
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select(`
        id,
        room_id,
        participant_id,
        original_name,
        sanitized_name,
        storage_path,
        mime_type,
        size,
        status,
        uploaded_at,
        participants:participant_id (display_name)
      `)
      .eq('room_id', room.id)
      .neq('status', 'failed')
      .order('uploaded_at', { ascending: false });

    if (filesError) {
      console.error('Error fetching files:', filesError);
    }

    const files: FileRecord[] = (filesData || []).map((f: any) => ({
      id: f.id,
      room_id: f.room_id,
      participant_id: f.participant_id,
      original_name: f.original_name,
      sanitized_name: f.sanitized_name,
      storage_path: f.storage_path,
      mime_type: f.mime_type,
      size: Number(f.size),
      status: f.status,
      uploaded_at: f.uploaded_at,
      uploader_name: f.participants?.display_name || 'Anonymous',
    }));

    // 6. Fetch all active participants for this room
    const { data: partsData, error: partsError } = await supabase
      .from('participants')
      .select('id, display_name, is_active, joined_at')
      .eq('room_id', room.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (partsError) {
      console.error('Error fetching participants:', partsError);
    }

    const participants = (partsData || []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      online: true,
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        created_at: room.created_at,
        expires_at: room.expires_at,
        is_active: room.is_active,
      } as Room,
      files,
      currentParticipant,
      participants,
    });
  } catch (err) {
    console.error('Unhandled error in GET /api/rooms/[code]:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while fetching room details.' },
      { status: 500 }
    );
  }
}
