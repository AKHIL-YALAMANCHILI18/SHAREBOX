import React from 'react';
import Link from 'next/link';
import { Box, Lock, Shield, Clock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-sb-border bg-surface py-12 mt-auto">
      <div className="container-wide space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-text flex items-center justify-center text-white">
              <Box className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-primary-text">
                SHAREBOX
              </span>
              <p className="text-[11px] text-secondary-text">
                Transfer anything. Anywhere.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-secondary-text">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>TLS / HTTPS Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>24h Ephemeral Rooms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              <span>Private Signed URLs</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-sb-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <p>© {new Date().getFullYear()} SHAREBOX. Built with Next.js, Supabase & Tailwind CSS.</p>
          <div className="flex items-center gap-4">
            <span>Ephemeral storage</span>
            <span>•</span>
            <span>No tracking</span>
            <span>•</span>
            <span>Direct transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
