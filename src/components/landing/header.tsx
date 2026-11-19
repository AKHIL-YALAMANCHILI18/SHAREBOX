import React from 'react';
import Link from 'next/link';
import { Box, ShieldCheck, Clock } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full border-b border-sb-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container-wide h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary-text flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Box className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-base text-primary-text leading-none">
              SHAREBOX
            </span>
            <span className="text-[10px] text-secondary-text font-mono tracking-wider uppercase mt-0.5">
              Universal Transfer
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs font-medium text-secondary-text">
          <div className="hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>End-to-End Secure</span>
          </div>
          <span className="hidden sm:inline text-zinc-300">•</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-accent" />
            <span>24h Ephemeral</span>
          </div>
        </div>
      </div>
    </header>
  );
}
