import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { authenticateParticipant } from '@/lib/security/auth';
import type { FileRecord, ApiError } from '@/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: fileId } = await params;

    const supabase = getSupabaseAdmin();

    // 1. Fetch file record and room
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*, rooms(*), participants:participant_id(display_name)')
      .eq('id', fileId)
      .single();

    if (fileError || !file || !file.rooms) {
      return NextResponse.json<ApiError>({ error: 'File not found' }, { status: 404 });
    }

    const room = file.rooms;

    // 2. Authenticate requesting participant
    const auth = await authenticateParticipant(request, room.code);
    if (!auth || auth.room.id !== room.id) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized to confirm upload for this room.' },
        { status: 401 }
      );
    }

    // 3. Verify upload session exists
    const { data: uploadSession } = await supabase
      .from('upload_sessions')
      .select('*')
      .eq('file_id', fileId)
      .eq('participant_id', auth.participant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!uploadSession) {
      // Still allow if participant matches the file uploader
      if (file.participant_id !== auth.participant.id) {
        return NextResponse.json<ApiError>(
          { error: 'No matching upload session found for this participant.' },
          { status: 403 }
        );
      }
    }

    // 4. Update file status to 'completed'
    const { data: updatedFile, error: updateError } = await supabase
      .from('files')
      .update({
        status: 'completed',
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .select('*, participants:participant_id(display_name)')
      .single();

    if (updateError || !updatedFile) {
      console.error('Error updating file status:', updateError);
      return NextResponse.json<ApiError>(
        { error: 'Failed to update file status.' },
        { status: 500 }
      );
    }

    // 5. Clean up the upload session
    await supabase.from('upload_sessions').delete().eq('file_id', fileId);

    const filePayload: FileRecord = {
      id: updatedFile.id,
      room_id: updatedFile.room_id,
      participant_id: updatedFile.participant_id,
      original_name: updatedFile.original_name,
      sanitized_name: updatedFile.sanitized_name,
      storage_path: updatedFile.storage_path,
      mime_type: updatedFile.mime_type,
      size: Number(updatedFile.size),
      status: updatedFile.status,
      uploaded_at: updatedFile.uploaded_at,
      uploader_name: updatedFile.participants?.display_name || auth.participant.display_name,
    };

    // 6. Broadcast realtime completion event to the room channel
    try {
      const channel = supabase.channel(`room:${room.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'file_completed',
        payload: { file: filePayload },
      });
      supabase.removeChannel(channel);
    } catch (rtErr) {
      console.warn('Realtime broadcast error on confirm:', rtErr);
    }

    return NextResponse.json({ file: filePayload });
  } catch (err) {
    console.error('Unhandled error in POST /api/files/[id]/confirm:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred while confirming the upload.' },
      { status: 500 }
    );
  }
}
