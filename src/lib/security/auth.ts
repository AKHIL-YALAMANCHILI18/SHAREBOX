import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hashSessionToken, getSessionToken } from './session';
import type { Participant, Room } from '@/types';

export interface AuthContext {
  participant: Participant;
  room: Room;
}

/**
 * Validates the current participant session for a given room code or general request.
 * Checks cookie first, then optional Authorization header (Bearer token).
 * Verifies room is active and has not expired.
 */
export async function authenticateParticipant(
  request: Request,
  roomCode?: string
): Promise<AuthContext | null> {
  try {
    let token: string | null = null;

    // Check room-scoped cookie if roomCode is known
    if (roomCode) {
      token = await getSessionToken(roomCode);
    }

    // Fallback: check Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // Fallback: parse cookies from request header directly if getSessionToken didn't find it
    if (!token) {
      const cookieHeader = request.headers.get('cookie') || '';
      if (roomCode) {
        const match = cookieHeader.match(new RegExp(`(?:^|; )sb_session_${roomCode}=([^;]*)`));
        if (match) token = decodeURIComponent(match[1]);
      } else {
        const match = cookieHeader.match(/(?:^|; )sb_session_[0-9]{8}=([^;]*)/);
        if (match) token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return null;
    }

    const tokenHash = hashSessionToken(token);
    const supabase = getSupabaseAdmin();

    // Query participant and join room
    const { data: participant, error } = await supabase
      .from('participants')
      .select('*, rooms(*)')
      .eq('session_token_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (error || !participant || !participant.rooms) {
      return null;
    }

    const room = participant.rooms as Room;

    // Verify room code if specified
    if (roomCode && room.code !== roomCode) {
      return null;
    }

    // Verify room is active and not expired
    if (!room.is_active || new Date(room.expires_at).getTime() <= Date.now()) {
      return null;
    }

    return {
      participant: {
        id: participant.id,
        room_id: participant.room_id,
        display_name: participant.display_name,
        session_token_hash: participant.session_token_hash,
        joined_at: participant.joined_at,
        is_active: participant.is_active,
      },
      room,
    };
  } catch (err) {
    console.error('authenticateParticipant error:', err);
    return null;
  }
}
