'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Box, Clock, Users, LogOut, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { useCountdown } from '@/hooks/use-countdown';
import { formatRoomCode } from '@/lib/utils';
import type { Room } from '@/types';

export interface RoomHeaderProps {
  room: Room;
  participantCount: number;
}

export function RoomHeader({ room, participantCount }: RoomHeaderProps) {
  const router = useRouter();
  const { formatted, isExpired } = useCountdown(room.expires_at);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${room.code}`
      : `/room/${room.code}`;

  const handleLeaveRoom = async () => {
    try {
      await fetch(`/api/rooms/${room.code}/leave`, { method: 'POST' });
    } catch (err) {
      console.error('Leave room error:', err);
    } finally {
      router.push('/');
    }
  };

  return (
    <header className="w-full border-b border-sb-border bg-surface sticky top-0 z-40">
      <div className="container-wide py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand + Room Code */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary-text flex items-center justify-center text-white">
              <Box className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-sm text-primary-text hidden sm:inline">
              SHAREBOX
            </span>
          </Link>

          <div className="h-5 w-[1px] bg-sb-border hidden sm:block" />

          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-background border border-sb-border rounded-lg px-2.5 py-1">
            <span className="text-[11px] font-medium text-secondary-text uppercase tracking-wider">
              Room
            </span>
            <span className="font-mono text-sm font-bold text-primary-text tracking-wider">
              {formatRoomCode(room.code)}
            </span>
            <CopyButton
              value={room.code}
              label=""
              copiedLabel=""
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              title="Copy Room Code"
            />
          </div>
        </div>

        {/* Center / Right: Status items + Actions */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 text-xs">
          {/* Expiration Timer */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${
              isExpired
                ? 'bg-red-50 text-error border-red-200'
                : 'bg-zinc-50 text-secondary-text border-sb-border'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatted}</span>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sb-border bg-zinc-50 text-secondary-text font-medium">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>
              {participantCount} {participantCount === 1 ? 'peer' : 'peers'} online
            </span>
          </div>

          {/* Share Link Copy Button */}
          <CopyButton
            value={inviteUrl}
            label="Share Link"
            copiedLabel="Link Copied!"
            size="sm"
            variant="secondary"
          />

          {/* Leave Room Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveRoom}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-secondary-text" />}
            className="text-secondary-text hover:text-error hover:bg-red-50"
          >
            Leave
          </Button>
        </div>
      </div>
    </header>
  );
}
