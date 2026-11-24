import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { clearSessionCookie, getSessionToken, hashSessionToken } from '@/lib/security/session';
import type { ApiError } from '@/types';

interface RouteParams {
  params: Promise<{
    code: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    if (!code || !/^\d{6,8}$/.test(code)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid room code' },
        { status: 400 }
      );
    }

    const sessionToken = await getSessionToken(code);
    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);
      const supabase = getSupabaseAdmin();

      // Find participant details
      const { data: part } = await supabase
        .from('participants')
        .select('id, room_id, display_name')
        .eq('session_token_hash', tokenHash)
        .single();

      if (part) {
        // Deactivate participant
        await supabase
          .from('participants')
          .update({ is_active: false })
          .eq('id', part.id);

        // Broadcast participant left event via Realtime channel
        try {
          await supabase.channel(`room:${part.room_id}`).send({
            type: 'broadcast',
            event: 'participant_left',
            payload: {
              participantId: part.id,
            },
          });
        } catch (rtErr) {
          console.warn('Realtime broadcast error on leave:', rtErr);
        }
      }

      // Clear cookie
      await clearSessionCookie(code);
    }

    return NextResponse.json({ success: true, message: 'Left room successfully' });
  } catch (err) {
    console.error('Unhandled error in POST /api/rooms/[code]/leave:', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
