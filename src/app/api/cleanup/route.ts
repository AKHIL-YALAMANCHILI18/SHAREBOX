import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getStorageAdapter } from '@/lib/storage/supabase-storage';
import type { ApiError } from '@/types';

export async function POST(request: Request) {
  try {
    // 1. Authenticate cleanup invocation using secret
    const configuredSecret = process.env.CLEANUP_SECRET;
    if (configuredSecret) {
      const authHeader = request.headers.get('authorization') || '';
      const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim();

      const url = new URL(request.url);
      const querySecret = url.searchParams.get('secret') || '';

      if (providedSecret !== configuredSecret && querySecret !== configuredSecret) {
        return NextResponse.json<ApiError>({ error: 'Unauthorized cleanup request' }, { status: 401 });
      }
    }

    const supabase = getSupabaseAdmin();
    const storage = getStorageAdapter();
    const nowIso = new Date().toISOString();

    // 2. Find expired active rooms
    const { data: expiredRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, code, expires_at')
      .eq('is_active', true)
      .lt('expires_at', nowIso)
      .limit(100);

    if (roomsError) {
      console.error('Error fetching expired rooms:', roomsError);
      return NextResponse.json<ApiError>({ error: 'Failed to query expired rooms' }, { status: 500 });
    }

    let cleanedRoomsCount = 0;
    let deletedFilesCount = 0;
    const errors: string[] = [];

    // 3. Process each expired room
    for (const room of expiredRooms || []) {
      try {
        // Fetch storage paths for all files in this room
        const { data: roomFiles } = await supabase
          .from('files')
          .select('storage_path')
          .eq('room_id', room.id);

        const storagePaths = (roomFiles || [])
          .map((f) => f.storage_path)
          .filter(Boolean);

        // Delete storage objects
        if (storagePaths.length > 0) {
          try {
            await storage.deleteFiles(storagePaths);
            deletedFilesCount += storagePaths.length;
          } catch (storageErr: any) {
            console.warn(`Storage cleanup warning for room ${room.id}:`, storageErr?.message);
          }
        }

        // Mark room as inactive (soft delete or cascade)
        await supabase
          .from('rooms')
          .update({ is_active: false })
          .eq('id', room.id);

        // Deactivate participants
        await supabase
          .from('participants')
          .update({ is_active: false })
          .eq('room_id', room.id);

        // Delete upload sessions for this room
        await supabase
          .from('upload_sessions')
          .delete()
          .eq('room_id', room.id);

        cleanedRoomsCount++;
      } catch (roomCleanErr: any) {
        console.error(`Error cleaning room ${room.id}:`, roomCleanErr);
        errors.push(`Room ${room.id}: ${roomCleanErr?.message}`);
      }
    }

    // 4. Also clean up any orphan expired upload sessions
    try {
      await supabase
        .from('upload_sessions')
        .delete()
        .lt('expires_at', nowIso);
    } catch (sessionCleanErr) {
      console.warn('Orphan upload session cleanup error:', sessionCleanErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      cleanedRooms: cleanedRoomsCount,
      deletedFiles: deletedFilesCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('Unhandled error in POST /api/cleanup:', err);
    return NextResponse.json<ApiError>(
      { error: 'An unexpected error occurred during cleanup.' },
      { status: 500 }
    );
  }
}
