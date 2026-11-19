'use client';

import React from 'react';
import { UserCheck } from 'lucide-react';
import type { PresenceParticipant } from '@/hooks/use-realtime';

export interface ParticipantsBarProps {
  participants: PresenceParticipant[];
  currentParticipantId: string;
}

export function ParticipantsBar({
  participants,
  currentParticipantId,
}: ParticipantsBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
      <div className="flex items-center gap-1.5 text-xs text-secondary-text font-medium flex-shrink-0">
        <UserCheck className="w-3.5 h-3.5 text-accent" />
        <span>In room:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {participants.map((p) => {
          const isCurrent = p.id === currentParticipantId;
          return (
            <div
              key={p.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isCurrent
                  ? 'bg-accent-light text-accent border-indigo-200'
                  : 'bg-surface text-primary-text border-sb-border'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0 animate-pulse" />
              <span className="truncate max-w-[100px]">{p.display_name}</span>
              {isCurrent && <span className="text-[10px] opacity-75">(You)</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
