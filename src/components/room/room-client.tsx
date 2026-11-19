'use client';

import React from 'react';
import { RoomHeader } from './room-header';
import { ParticipantsBar } from './participants-bar';
import { FileUploadZone } from './file-upload-zone';
import { FileList } from './file-list';
import { RoomExpired } from './room-expired';
import { useRoom } from '@/hooks/use-room';
import { useCountdown } from '@/hooks/use-countdown';
import type { Room, Participant, FileRecord } from '@/types';

export interface RoomClientProps {
  initialRoom: Room;
  initialParticipant: Participant;
  initialFiles: FileRecord[];
}

export function RoomClient({
  initialRoom,
  initialParticipant,
  initialFiles,
}: RoomClientProps) {
  const {
    room,
    participant,
    files,
    participants,
    deleteFile,
    downloadFile,
    downloadAll,
    handleFileUploaded,
  } = useRoom({
    initialRoom,
    initialParticipant,
    initialFiles,
  });

  const { isExpired } = useCountdown(room.expires_at);

  if (isExpired || !room.is_active) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <RoomHeader room={room} participantCount={0} />
        <main className="container-tight py-8 flex-1">
          <RoomExpired />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <RoomHeader room={room} participantCount={participants.length} />

      <main className="container-tight py-6 sm:py-8 space-y-6 flex-1">
        {/* Presence Bar */}
        <div className="p-3 rounded-xl border border-sb-border bg-surface shadow-subtle">
          <ParticipantsBar
            participants={participants}
            currentParticipantId={participant.id}
          />
        </div>

        {/* Upload Zone */}
        <FileUploadZone
          roomCode={room.code}
          onUploadCompleted={handleFileUploaded}
          disabled={isExpired}
        />

        {/* File List */}
        <div className="pt-2">
          <FileList
            files={files}
            currentParticipantId={participant.id}
            onDownloadFile={downloadFile}
            onDeleteFile={deleteFile}
            onDownloadAll={downloadAll}
          />
        </div>
      </main>
    </div>
  );
}
