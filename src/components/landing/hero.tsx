'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Sparkles, KeyRound, AlertCircle, Shuffle, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function Hero() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createType, setCreateType] = useState<'random' | 'custom'>('random');
  const [customCode, setCustomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Handle Create Room (Random or Custom)
  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCreateError(null);

    if (createType === 'custom') {
      const cleanCustom = customCode.replace(/\D/g, '');
      if (cleanCustom.length !== 6) {
        setCreateError('Please enter a 6-digit numeric room code.');
        return;
      }
    }

    setIsCreating(true);
    try {
      const payload: { displayName?: string; codeType: 'random' | 'custom'; customCode?: string } = {
        codeType: createType,
        displayName: displayName.trim() || undefined,
      };

      if (createType === 'custom') {
        payload.customCode = customCode.replace(/\D/g, '');
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create room');
      setIsCreating(false);
    }
  };

  const handleCustomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCustomCode(raw);
    if (createError) setCreateError(null);
  };

  // Handle Join Room
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.replace(/\D/g, '');
    if (cleanCode.length !== 6 && cleanCode.length !== 8) {
      setJoinError('Please enter a 6-digit numeric room code');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() || undefined }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to join room');
      }

      router.push(`/room/${cleanCode}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Room not found or expired');
      setIsJoining(false);
    }
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8);
    setJoinCode(raw);
    if (joinError) setJoinError(null);
  };

  const isJoinDisabled = joinCode.length !== 6 && joinCode.length !== 8;

  return (
    <section className="pt-10 pb-16 md:pt-16 md:pb-24 border-b border-sb-border/60">
      <div className="container-tight text-center space-y-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-light border border-indigo-200 text-accent text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>No accounts. No installations. Pure instant transfer.</span>
        </div>

        {/* Hero headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary-text leading-[1.1]">
          Transfer anything.{' '}
          <span className="text-accent">Anywhere.</span>
        </h1>

        {/* Supporting description */}
        <p className="text-base sm:text-lg text-secondary-text max-w-xl mx-auto text-balance font-normal leading-relaxed">
          Exchange documents, media, code, or massive archives securely between any device.
          Powered by 6-digit codes and private 24-hour ephemeral rooms.
        </p>

        {/* Optional Nickname input */}
        <div className="pt-2 max-w-xs mx-auto">
          <Input
            placeholder="Your name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="text-center text-xs h-9 bg-surface"
          />
        </div>

        {/* Immediate Action Cards: Create vs Join */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto items-stretch">
          {/* Card 1: Create Room */}
          <Card className="flex flex-col justify-between hoverable border-zinc-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-accent">
                  <Plus className="w-4 h-4" />
                </div>
                {/* Generation Type Segmented Control */}
                <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/80 text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateType('random');
                      setCreateError(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      createType === 'random'
                        ? 'bg-white text-primary-text font-semibold shadow-xs'
                        : 'text-secondary-text hover:text-primary-text'
                    }`}
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>Random</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateType('custom');
                      setCreateError(null);
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                      createType === 'custom'
                        ? 'bg-white text-primary-text font-semibold shadow-xs'
                        : 'text-secondary-text hover:text-primary-text'
                    }`}
                  >
                    <Hash className="w-3 h-3" />
                    <span>Custom</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-primary-text">Create Room</h2>
                <p className="text-xs text-secondary-text leading-relaxed mt-0.5">
                  {createType === 'random'
                    ? 'Generate a unique 6-digit transfer room. Drop your files and share the code with anyone.'
                    : 'Choose your own 6-digit code. Claim any available code for your 24-hour transfer room.'}
                </p>
              </div>

              {/* Custom Code Input when Custom is selected */}
              {createType === 'custom' && (
                <div className="pt-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={customCode}
                    onChange={handleCustomCodeChange}
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-base font-semibold"
                    error={createError || undefined}
                    autoFocus
                  />
                  <p className="text-[11px] text-secondary-text mt-1 text-center">
                    Must be exactly 6 digits (0-9)
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4">
              {createError && (
                <div className="mb-3 flex items-start gap-1.5 text-xs text-error">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}
              <Button
                variant="primary"
                fullWidth
                isLoading={isCreating}
                disabled={createType === 'custom' && customCode.length !== 6}
                onClick={handleCreateRoom}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {createType === 'random' ? 'Create Room Now' : 'Create Custom Room'}
              </Button>
            </div>
          </Card>

          {/* Card 2: Join Room */}
          <Card className="flex flex-col justify-between hoverable border-zinc-200">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-sb-border flex items-center justify-center text-secondary-text">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary-text">Join with Code</h2>
                <p className="text-xs text-secondary-text leading-relaxed mt-0.5">
                  Enter a 6-digit room code to instantly download files and transfer your own files back.
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="pt-4 space-y-3">
              <div>
                <Input
                  placeholder="000 000"
                  value={joinCode}
                  onChange={handleJoinCodeChange}
                  maxLength={8}
                  className="font-mono text-center tracking-widest text-base font-semibold"
                  error={joinError || undefined}
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                fullWidth
                isLoading={isJoining}
                disabled={isJoinDisabled}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Join Room
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
