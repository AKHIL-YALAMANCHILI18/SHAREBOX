import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { generateRoomCode } from '@/lib/security/hash';
import { generateSessionToken, hashSessionToken, setSessionCookie } from '@/lib/security/session';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { RATE_LIMITS, getRandomDisplayName, ROOM_EXPIRY_HOURS } from '@/lib/constants';
import type { CreateRoomRequest, CreateRoomResponse, ApiError } from '@/types';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // 1. Enforce base rate limiting on room creation
    const rateCheck = checkRateLimit(`create_room:${ip}`, RATE_LIMITS.createRoom);
    if (!rateCheck.allowed) {
      return NextResponse.json<ApiError>(
        { error: 'Too many room creation requests. Please try again shortly.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // 2. Parse request body
    let displayName = '';
    let codeType: 'random' | 'custom' = 'random';
    let customCode = '';

    try {
      const body: CreateRoomRequest = await request.json();
      if (body.displayName && typeof body.displayName === 'string') {
        displayName = body.displayName.trim().slice(0, 50);
      }
      if (body.codeType === 'custom') {
        codeType = 'custom';
        if (typeof body.customCode === 'string') {
          customCode = body.customCode.trim();
        }
      }
    } catch {
      // Body is optional
    }

    if (!displayName) {
      displayName = getRandomDisplayName();
    }

    const supabase = getSupabaseAdmin();
    let room = null;

    // 3. Option A: Custom Code
    if (codeType === 'custom') {
      // Enforce rate limiting specifically for custom room-code attempts
      const customRateCheck = checkRateLimit(`create_custom_room:${ip}`, RATE_LIMITS.createCustomRoom);
      if (!customRateCheck.allowed) {
        return NextResponse.json<ApiError>(
          { error: 'Too many custom code attempts. Please wait a minute or use a random code.' },
          { status: 429, headers: { 'Retry-After': String(Math.ceil((customRateCheck.resetAt - Date.now()) / 1000)) } }
        );
      }

      // Validate exactly 6 numeric digits
      if (!customCode || !/^\d{6}$/.test(customCode)) {
        return NextResponse.json<ApiError>(
          { error: 'Custom room code must be exactly 6 numeric digits (0–9).' },
          { status: 400 }
        );
      }

      // Check uniqueness against all active room codes
      const { data: existingActive } = await supabase
        .from('rooms')
        .select('id, expires_at, is_active')
        .eq('code', customCode)
        .eq('is_active', true)
        .maybeSingle();

      if (existingActive) {
        // If room is actively in use and has not expired yet
        if (new Date(existingActive.expires_at).getTime() > Date.now()) {
          return NextResponse.json<ApiError>(
            {
              error: `Room code "${customCode}" is already in use by an active room. Please choose another 6-digit code.`,
              code: 'CODE_ALREADY_EXISTS',
            },
            { status: 409 }
          );
        } else {
          // Room expired but cron hasn't marked it inactive yet; deactivate it to free the code safely
          await supabase.from('rooms').update({ is_active: false }).eq('id', existingActive.id);
        }
      }

      // Insert custom room with database-level uniqueness enforcement
      const expiresAt = new Date(Date.now() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
      const { data: createdRoom, error: insertError } = await supabase
        .from('rooms')
        .insert({
          code: customCode,
          expires_at: expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        // Check for unique collision (Postgres error 23505)
        if (insertError.code === '23505') {
          return NextResponse.json<ApiError>(
            {
              error: `Room code "${customCode}" is already in use by an active room. Please choose another 6-digit code.`,
              code: 'CODE_ALREADY_EXISTS',
            },
            { status: 409 }
          );
        }

        console.error('Custom room creation database error:', insertError);
        return NextResponse.json<ApiError>(
          { error: 'Failed to create room with custom code.' },
          { status: 500 }
        );
      }

      room = createdRoom;
    } else {
      // 3. Option B: Random Code (default) with safe retry logic
      const maxRetries = 5;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const candidateCode = generateRoomCode();

        // Check if an active room already exists with this code
        const { data: existingActive } = await supabase
          .from('rooms')
          .select('id, expires_at, is_active')
          .eq('code', candidateCode)
          .eq('is_active', true)
          .maybeSingle();

        if (existingActive) {
          if (new Date(existingActive.expires_at).getTime() <= Date.now()) {
            await supabase.from('rooms').update({ is_active: false }).eq('id', existingActive.id);
          } else {
            // Active collision; retry with fresh random code
            continue;
          }
        }

        const expiresAt = new Date(Date.now() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
          .from('rooms')
          .insert({
            code: candidateCode,
            expires_at: expiresAt,
            is_active: true,
          })
          .select()
          .single();

        if (!error && data) {
          room = data;
          break;
        }

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
