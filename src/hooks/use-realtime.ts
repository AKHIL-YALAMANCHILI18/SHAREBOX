'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { FileRecord, PresenceParticipant } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type { PresenceParticipant };

export interface UseRealtimeOptions {
  roomId: string;
  currentParticipant: { id: string; display_name: string };
  onFileAdded?: (file: FileRecord) => void;
  onFileCompleted?: (file: FileRecord) => void;
  onFileRemoved?: (fileId: string) => void;
  onParticipantsChange?: (participants: PresenceParticipant[]) => void;
  onParticipantJoined?: (participant: PresenceParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export function useRealtime({
  roomId,
  currentParticipant,
  onFileAdded,
  onFileCompleted,
  onFileRemoved,
  onParticipantsChange,
  onParticipantJoined,
  onParticipantLeft,
}: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [participants, setParticipants] = useState<PresenceParticipant[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep callback refs fresh to avoid re-subscribing unnecessarily
  const onFileAddedRef = useRef(onFileAdded);
  const onFileCompletedRef = useRef(onFileCompleted);
  const onFileRemovedRef = useRef(onFileRemoved);
  const onParticipantsChangeRef = useRef(onParticipantsChange);
  const onParticipantJoinedRef = useRef(onParticipantJoined);
  const onParticipantLeftRef = useRef(onParticipantLeft);

  useEffect(() => {
    onFileAddedRef.current = onFileAdded;
    onFileCompletedRef.current = onFileCompleted;
    onFileRemovedRef.current = onFileRemoved;
    onParticipantsChangeRef.current = onParticipantsChange;
    onParticipantJoinedRef.current = onParticipantJoined;
    onParticipantLeftRef.current = onParticipantLeft;
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
        if (activeParticipants.length > 0) {
          onParticipantsChangeRef.current?.(activeParticipants);
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (newPresences && newPresences.length > 0) {
          newPresences.forEach((p: any) => {
            onParticipantJoinedRef.current?.({
              id: p.id || key,
              display_name: p.display_name || 'Anonymous',
              online: true,
            });
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        if (leftPresences && leftPresences.length > 0) {
          leftPresences.forEach((p: any) => {
            const id = p.id || key;
            if (id) {
              onParticipantLeftRef.current?.(id);
            }
          });
        }
      });

    // 2. Broadcast events for participant actions
    channel
      .on('broadcast', { event: 'participant_joined' }, ({ payload }) => {
        if (payload?.participant) {
          onParticipantJoinedRef.current?.({
            id: payload.participant.id,
            display_name: payload.participant.display_name,
            online: true,
          });
        }
      })
      .on('broadcast', { event: 'participant_left' }, ({ payload }) => {
        if (payload?.participantId) {
          onParticipantLeftRef.current?.(payload.participantId);
        }
      });

    // 3. Broadcast events for file actions
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

    // 4. Postgres changes as fallback for files
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
        try {
          await channel.track({
            id: currentParticipant.id,
            display_name: currentParticipant.display_name,
            online_at: new Date().toISOString(),
          });
          // Broadcast local participant arrival to all connected peers
          await channel.send({
            type: 'broadcast',
            event: 'participant_joined',
            payload: {
              participant: {
                id: currentParticipant.id,
                display_name: currentParticipant.display_name,
                online: true,
              },
            },
          });
        } catch (err) {
          console.warn('Realtime presence track/broadcast error:', err);
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    // Handle beforeunload to notify peers
    const handleBeforeUnload = () => {
      try {
        channel.send({
          type: 'broadcast',
          event: 'participant_left',
          payload: { participantId: currentParticipant.id },
        });
        channel.untrack();
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (channelRef.current) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'participant_left',
            payload: { participantId: currentParticipant.id },
          });
          channelRef.current.untrack();
          supabase.removeChannel(channelRef.current);
        } catch {
          // ignore
        }
        channelRef.current = null;
      }
    };
  }, [roomId, currentParticipant.id, currentParticipant.display_name]);

  return { isConnected, participants };
}
