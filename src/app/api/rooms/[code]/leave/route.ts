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

    if (!code || !/^\d{8}$/.test(code)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid room code' },
        { status: 400 }
      );
    }

    const sessionToken = await getSessionToken(code);
    if (sessionToken) {
      const tokenHash = hashSessionToken(sessionToken);
      const supabase = getSupabaseAdmin();

      // Deactivate participant
      await supabase
        .from('participants')
        .update({ is_active: false })
        .eq('session_token_hash', tokenHash);

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
