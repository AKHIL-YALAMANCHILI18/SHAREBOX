import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateRoomCode } from '@/lib/security/hash';
import { generateSessionToken, hashSessionToken, setSessionCookie } from '@/lib/security/session';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { RATE_LIMITS, getRandomDisplayName, ROOM_EXPIRY_HOURS } from '@/lib/constants';
import type { CreateRoomRequest, CreateRoomResponse, ApiError } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Enforce rate limiting
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`create_room:${ip}`, RATE_LIMITS.createRoom);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Too many room creation requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // 2. Parse request body
    let displayName = '';
    try {
      const body: CreateRoomRequest = await request.json();
      if (body.displayName && typeof body.displayName === 'string') {
        displayName = body.displayName.trim().slice(0, 50);
      }
    } catch {
      // Body is optional
    }

    if (!displayName) {
      displayName = getRandomDisplayName();
    }

    const supabase = getSupabaseAdmin();

    // 3. Generate unique room code with retries
    let room = null;
    let roomCode = '';
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      roomCode = generateRoomCode();
      const expiresAt = new Date(Date.now() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          code: roomCode,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        room = data;
        break;
      }

      // Check if collision error (unique constraint violation code 23505)
      if (error && error.code !== '23505') {
        console.error('Room creation database error:', error);
        return NextResponse.json<ApiError>(
          { error: 'Failed to create room' },
          { status: 500 }
        );
      }
    }

    if (!room) {
      return NextResponse.json<ApiError>(
        { error: 'Could not generate unique room code. Please try again.' },
        { status: 500 }
      );
    }

    // 4. Create participant session
    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);

    const { data: participant, error: partError } = await supabase
      .from('participants')
      .insert({
        room_id: room.id,
        display_name: displayName,
        session_token_hash: sessionTokenHash,
        is_active: true,
      })
      .select('id, display_name')
      .single();

    if (partError || !participant) {
      console.error('Participant creation database error:', partError);
      return NextResponse.json<ApiError>(
        { error: 'Failed to create participant session' },
        { status: 500 }
      );
    }

    // 5. Set session cookie
    await setSessionCookie(sessionToken, room.code);

    const responsePayload: CreateRoomResponse = {
      room: {
        id: room.id,
        code: room.code,
        created_at: room.created_at,
        expires_at: room.expires_at,
        is_active: room.is_active,
      },
      sessionToken,
      participant: {
        id: participant.id,
        display_name: participant.display_name,
      },
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err) {
    console.error('Unhandled error in POST /api/rooms:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while creating the room.' },
      { status: 500 }
    );
  }
}
