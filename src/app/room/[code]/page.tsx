import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  getSessionToken,
  setSessionCookie,
  generateSessionToken,
  hashSessionToken,
} from '@/lib/security/session';
import { getRandomDisplayName } from '@/lib/constants';
import { RoomClient } from '@/components/room/room-client';
import { RoomExpired } from '@/components/room/room-expired';
import { RoomHeader } from '@/components/room/room-header';
import type { Room, Participant, FileRecord } from '@/types';

export const dynamic = 'force-dynamic';

interface RoomPageProps {
  params: Promise<{ code: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;

  // Validate 8-digit numeric room code format
  if (!code || !/^\d{8}$/.test(code)) {
    notFound();
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    console.error('Database connection error:', err);
    notFound();
  }

  // 1. Fetch room from database
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .single();

  if (roomError || !roomData) {
    notFound();
  }

  const room = roomData as Room;

  // 2. Check if room is expired or inactive
  const isExpired =
    !room.is_active || new Date(room.expires_at).getTime() <= Date.now();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background">
        <RoomHeader room={room} participantCount={0} />
        <main className="container-tight py-12">
          <RoomExpired />
        </main>
      </div>
    );
  }

  // 3. Resolve participant session
  let participant: Participant | null = null;
  const existingToken = await getSessionToken(code);

  if (existingToken) {
    const tokenHash = hashSessionToken(existingToken);
    const { data: partData } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('session_token_hash', tokenHash)
      .eq('is_active', true)
      .single();

    if (partData) {
      participant = partData as Participant;
    }
  }

  // If no existing active session for this room (e.g. joined via shared direct URL), create one
  if (!participant) {
    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const displayName = getRandomDisplayName();

    const { data: newPart, error: createPartError } = await supabase
      .from('participants')
      .insert({
        room_id: room.id,
        display_name: displayName,
        session_token_hash: tokenHash,
        is_active: true,
      })
      .select()
      .single();

    if (createPartError || !newPart) {
      console.error('Failed to create participant:', createPartError);
      notFound();
    }

    await setSessionCookie(token, code);
    participant = newPart as Participant;
  }

  // 4. Fetch existing files for room
  const { data: filesData } = await supabase
    .from('files')
    .select('*')
    .eq('room_id', room.id)
    .order('uploaded_at', { ascending: false });

  const files = (filesData || []) as FileRecord[];

  return (
    <RoomClient
      initialRoom={room}
      initialParticipant={participant}
      initialFiles={files}
    />
  );
}
