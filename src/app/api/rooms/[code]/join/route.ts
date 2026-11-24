import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateSessionToken, hashSessionToken, setSessionCookie, getSessionToken } from '@/lib/security/session';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { RATE_LIMITS, getRandomDisplayName, sanitizeDisplayName, resolveDisplayName } from '@/lib/constants';
import type { JoinRoomRequest, JoinRoomResponse, FileRecord, Room, ApiError } from '@/types';

interface RouteParams {
  params: Promise<{
    code: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    // 1. Rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`join_room:${ip}`, RATE_LIMITS.joinRoom);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Too many join attempts. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // 2. Validate room code (6 digits, supporting legacy 8 digits)
    if (!code || !/^\d{6,8}$/.test(code)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid room code format. Must be a 6-digit number.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 3. Lookup room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      return NextResponse.json<ApiError>(
        { error: 'Room not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // 4. Verify expiration
    if (new Date(room.expires_at).getTime() <= Date.now()) {
      return NextResponse.json<ApiError>(
        { error: 'This room has expired and is no longer accessible.' },
        { status: 410 }
      );
    }

    // 5. Parse display name
    let userProvidedName: string | null = null;
    try {
      const body: JoinRoomRequest = await request.json();
      if (body.displayName) {
        userProvidedName = sanitizeDisplayName(body.displayName);
      }
    } catch {
      // Optional body
    }

    const displayName = userProvidedName || getRandomDisplayName();

    // 6. Check existing session
    let sessionToken = await getSessionToken(code);
    let participant = null;

    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);
      const { data: existingPart } = await supabase
        .from('participants')
        .select('id, display_name, is_active')
        .eq('room_id', room.id)
        .eq('session_token_hash', tokenHash)
        .single();

      if (existingPart) {
        const updateFields: { is_active: boolean; display_name?: string } = { is_active: true };
        // If user explicitly provided a name, update it!
        if (userProvidedName && existingPart.display_name !== userProvidedName) {
          updateFields.display_name = userProvidedName;
        }

        await supabase
          .from('participants')
          .update(updateFields)
          .eq('id', existingPart.id);

        participant = {
          id: existingPart.id,
          display_name: updateFields.display_name || existingPart.display_name,
        };
      }
    }

    // 7. If no valid existing session, create new participant
    if (!participant) {
      sessionToken = generateSessionToken();
      const sessionTokenHash = hashSessionToken(sessionToken);

      const { data: newPart, error: partError } = await supabase
        .from('participants')
        .insert({
          room_id: room.id,
          display_name: displayName,
          session_token_hash: sessionTokenHash,
          is_active: true,
        })
        .select('id, display_name')
        .single();

      if (partError || !newPart) {
        console.error('Error creating participant on join:', partError);
        return NextResponse.json<ApiError>(
          { error: 'Failed to join room' },
          { status: 500 }
        );
      }

      participant = newPart;
    }

    // 8. Set session cookie
    if (sessionToken) {
      await setSessionCookie(sessionToken, room.code);
    }

    // Broadcast participant joined event via Realtime channel
    try {
      await supabase.channel(`room:${room.id}`).send({
        type: 'broadcast',
        event: 'participant_joined',
        payload: {
          participant: {
            id: participant.id,
            display_name: participant.display_name,
            online: true,
          },
        },
      });
    } catch (rtErr) {
      console.warn('Realtime broadcast error on join:', rtErr);
    }

    // 9. Fetch current files in room
    const { data: filesData } = await supabase
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

    // 10. Fetch all active participants in room
    const { data: partsData } = await supabase
      .from('participants')
      .select('id, display_name, is_active, joined_at')
      .eq('room_id', room.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    const participants = (partsData || []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      online: true,
    }));

    const responsePayload: JoinRoomResponse = {
      room: {
        id: room.id,
        code: room.code,
        created_at: room.created_at,
        expires_at: room.expires_at,
        is_active: room.is_active,
      } as Room,
      sessionToken: sessionToken || '',
      participant,
      files,
      participants,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    console.error('Unhandled error in POST /api/rooms/[code]/join:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while joining the room.' },
      { status: 500 }
    );
  }
}
