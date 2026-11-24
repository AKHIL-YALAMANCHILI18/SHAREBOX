'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Room, FileRecord, Participant, PresenceParticipant } from '@/types';
import { useRealtime } from './use-realtime';

export interface UseRoomOptions {
  initialRoom: Room;
  initialParticipant: Participant;
  initialFiles: FileRecord[];
  initialParticipants?: PresenceParticipant[];
}

export function useRoom({
  initialRoom,
  initialParticipant,
  initialFiles,
  initialParticipants,
}: UseRoomOptions) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [participant] = useState<Participant>(initialParticipant);
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);

  // Initialize participants list with all active room participants
  const [participants, setParticipants] = useState<PresenceParticipant[]>(() => {
    const list: PresenceParticipant[] =
      initialParticipants && initialParticipants.length > 0
        ? [...initialParticipants]
        : [];

    if (!list.some((p) => p.id === initialParticipant.id)) {
      list.push({
        id: initialParticipant.id,
        display_name: initialParticipant.display_name,
        online: true,
      });
    }
    return list;
  });

  // Handle participant joined in real time (deduplicated by ID)
  const handleParticipantJoined = useCallback((newPart: PresenceParticipant) => {
    if (!newPart || !newPart.id) return;
    setParticipants((prev) => {
      const idx = prev.findIndex((p) => p.id === newPart.id);
      if (idx >= 0) {
        if (
          prev[idx].display_name === newPart.display_name &&
          prev[idx].online === newPart.online
        ) {
          return prev;
        }
        const copy = [...prev];
        copy[idx] = { ...prev[idx], ...newPart, online: true };
        return copy;
      }
      return [...prev, { ...newPart, online: true }];
    });
  }, []);

  // Handle participant left in real time
  const handleParticipantLeft = useCallback(
    (participantId: string) => {
      if (!participantId) return;
      setParticipants((prev) => {
        // Never remove current participant from their own view
        if (participantId === initialParticipant.id) return prev;
        return prev.filter((p) => p.id !== participantId);
      });
    },
    [initialParticipant.id]
  );

  // Handle presence sync updates without wiping out existing known room participants
  const handleParticipantsSync = useCallback(
    (activePresences: PresenceParticipant[]) => {
      if (!activePresences || activePresences.length === 0) return;
      setParticipants((prev) => {
        const map = new Map<string, PresenceParticipant>();
        // Keep existing known participants
        for (const p of prev) {
          map.set(p.id, p);
        }
        // Merge presence data
        for (const p of activePresences) {
          map.set(p.id, { ...(map.get(p.id) || {}), ...p, online: true });
        }
        // Ensure current participant is always present
        if (!map.has(initialParticipant.id)) {
          map.set(initialParticipant.id, {
            id: initialParticipant.id,
            display_name: initialParticipant.display_name,
            online: true,
          });
        }
        return Array.from(map.values());
      });
    },
    [initialParticipant.id, initialParticipant.display_name]
  );

  // Fetch initial/latest active participants from database API on mount
  useEffect(() => {
    let isMounted = true;
    async function loadLatestParticipants() {
      try {
        const res = await fetch(`/api/rooms/${room.code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data.participants) && data.participants.length > 0) {
          setParticipants((prev) => {
            const map = new Map<string, PresenceParticipant>();
            // Keep existing active room participants
            for (const p of prev) {
              map.set(p.id, p);
            }
            // Merge participants from API query
            for (const p of data.participants) {
              map.set(p.id, {
                id: p.id,
                display_name: p.display_name,
                online: true,
              });
            }
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Could not fetch latest participants:', err);
      }
    }

    loadLatestParticipants();

    return () => {
      isMounted = false;
    };
  }, [room.code]);

  // Realtime hook integration
  useRealtime({
    roomId: room.id,
    currentParticipant: participant,
    onFileAdded: (newFile) => {
      setFiles((prev) => {
        if (prev.some((f) => f.id === newFile.id)) return prev;
        return [newFile, ...prev];
      });
    },
    onFileCompleted: (completedFile) => {
      setFiles((prev) => {
        const index = prev.findIndex((f) => f.id === completedFile.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = completedFile;
          return updated;
        }
        return [completedFile, ...prev];
      });
    },
    onFileRemoved: (fileId) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    onParticipantsChange: handleParticipantsSync,
    onParticipantJoined: handleParticipantJoined,
    onParticipantLeft: handleParticipantLeft,
  });

  // Action: Add completed file locally immediately
  const handleFileUploaded = useCallback((file: FileRecord) => {
    setFiles((prev) => {
      const exists = prev.findIndex((f) => f.id === file.id);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = file;
        return copy;
      }
      return [file, ...prev];
    });
  }, []);

  // Action: Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete file');
      }
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  }, []);

  // Action: Download single file
  const downloadFile = useCallback(async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`);
      if (!res.ok) {
        throw new Error('Failed to get download link');
      }
      const data = await res.json();
      if (data.downloadUrl) {
        // Trigger browser download
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Download error:', err);
      throw err;
    }
  }, []);

  // Action: Download all completed files
  const downloadAll = useCallback(async () => {
    try {
      const res = await fetch('/api/files/download-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: room.code }),
      });
      if (!res.ok) {
        throw new Error('Failed to get download URLs');
      }
      const data = await res.json();
      const filesToDownload: { name: string; url: string }[] = data.files || [];

      // Download each with small delay to avoid browser blocking multiple downloads
      for (let i = 0; i < filesToDownload.length; i++) {
        const item = filesToDownload[i];
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = item.url;
          a.download = item.name;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, i * 350);
      }
    } catch (err) {
      console.error('Download all error:', err);
      throw err;
    }
  }, [room.code]);

  return {
    room,
    participant,
    files,
    participants,
    deleteFile,
    downloadFile,
    downloadAll,
    handleFileUploaded,
  };
}
