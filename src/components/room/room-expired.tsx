'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RoomExpired() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-sb-border bg-surface shadow-card">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-primary-text">
            This room has expired
          </h2>
          <p className="text-xs text-secondary-text leading-relaxed">
            For privacy and security, SHAREBOX transfer rooms and all uploaded files are
            permanently destroyed 24 hours after creation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              fullWidth
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Room
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
