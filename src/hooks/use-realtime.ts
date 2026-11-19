'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { FileRecord, Participant } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceParticipant {
  id: string;
  display_name: string;
  online: boolean;
}

export interface UseRealtimeOptions {
  roomId: string;
  currentParticipant: { id: string; display_name: string };
  onFileAdded?: (file: FileRecord) => void;
  onFileCompleted?: (file: FileRecord) => void;
  onFileRemoved?: (fileId: string) => void;
  onParticipantsChange?: (participants: PresenceParticipant[]) => void;
}

export function useRealtime({
  roomId,
  currentParticipant,
  onFileAdded,
  onFileCompleted,
  onFileRemoved,
  onParticipantsChange,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [participants, setParticipants] = useState<PresenceParticipant[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep callback refs fresh
  const onFileAddedRef = useRef(onFileAdded);
  const onFileCompletedRef = useRef(onFileCompleted);
  const onFileRemovedRef = useRef(onFileRemoved);
  const onParticipantsChangeRef = useRef(onParticipantsChange);

  useEffect(() => {
    onFileAddedRef.current = onFileAdded;
    onFileCompletedRef.current = onFileCompleted;
    onFileRemovedRef.current = onFileRemoved;
    onParticipantsChangeRef.current = onParticipantsChange;
  });

  useEffect(() => {
    if (!roomId) return;

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch {
      // In case Supabase env vars are not set during test/local dev without env
      console.warn('Supabase client could not be initialized for realtime.');
      return;
    }

    const channelName = `room:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentParticipant.id,
        },
      },
    });

    // 1. Presence handlers
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeParticipants: PresenceParticipant[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (presences && presences.length > 0) {
            const latest = presences[0] as unknown as { id: string; display_name: string };
            activeParticipants.push({
              id: latest.id || key,
              display_name: latest.display_name || 'Anonymous',
              online: true,
            });
          }
        });

        setParticipants(activeParticipants);
        onParticipantsChangeRef.current?.(activeParticipants);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Handled via sync
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Handled via sync
      });

    // 2. Broadcast events for file actions
    channel
      .on('broadcast', { event: 'file_added' }, ({ payload }) => {
        if (payload?.file) {
          onFileAddedRef.current?.(payload.file);
        }
      })
      .on('broadcast', { event: 'file_completed' }, ({ payload }) => {
        if (payload?.file) {
          onFileCompletedRef.current?.(payload.file);
        }
      })
      .on('broadcast', { event: 'file_removed' }, ({ payload }) => {
        if (payload?.fileId) {
          onFileRemovedRef.current?.(payload.fileId);
        }
      });

    // 3. Postgres changes as fallback
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'files',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new) {
            const file = payload.new as FileRecord;
            if (file.status === 'completed') {
              onFileCompletedRef.current?.(file);
            } else {
              onFileAddedRef.current?.(file);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.new) {
            const file = payload.new as FileRecord;
            if (file.status === 'completed') {
              onFileCompletedRef.current?.(file);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'files',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.old?.id) {
            onFileRemovedRef.current?.(payload.old.id);
          }
        }
      );

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({
          id: currentParticipant.id,
          display_name: currentParticipant.display_name,
          online_at: new Date().toISOString(),
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, currentParticipant.id, currentParticipant.display_name]);

  return { isConnected, participants };
}
