'use client';

import { useState, useCallback } from 'react';
import type { Room, FileRecord, Participant } from '@/types';
import { useRealtime, type PresenceParticipant } from './use-realtime';

export interface UseRoomOptions {
  initialRoom: Room;
  initialParticipant: Participant;
  initialFiles: FileRecord[];
}

export function useRoom({ initialRoom, initialParticipant, initialFiles }: UseRoomOptions) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [participant] = useState<Participant>(initialParticipant);
  const [files, setFiles] = useState<FileRecord[]>(initialFiles);
  const [participants, setParticipants] = useState<PresenceParticipant[]>([
    {
      id: initialParticipant.id,
      display_name: initialParticipant.display_name,
      online: true,
    },
  ]);

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
    onParticipantsChange: (activeParticipants) => {
      setParticipants(activeParticipants);
    },
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
