import React from 'react';
import {
  FileCode,
  ShieldCheck,
  Clock,
  Zap,
  Globe,
  HardDriveDownload,
  Lock,
  Layers,
} from 'lucide-react';

export function Features() {
  const supportedTypes = [
    { label: 'Documents', exts: 'PDF, DOCX, XLSX, PPTX, TXT, RTF' },
    { label: 'Media', exts: 'MP4, MOV, MP3, WAV, PNG, JPG, WEBP, SVG' },
    { label: 'Archives', exts: 'ZIP, RAR, 7Z, TAR, GZ, ISO' },
    { label: 'Code & Binaries', exts: 'JS, TS, PY, JAVA, APK, EXE, BIN' },
  ];

  const features = [
    {
      icon: <Layers className="w-4 h-4 text-accent" />,
      title: 'Universal format support',
      desc: 'No arbitrary file restrictions. Upload any extension, binary or document with original bytes preserved.',
    },
    {
      icon: <Zap className="w-4 h-4 text-accent" />,
      title: 'Instant real-time sync',
      desc: 'Powered by Supabase Realtime WebSocket engine. New files appear immediately on all screens without reload.',
    },
    {
      icon: <Clock className="w-4 h-4 text-accent" />,
      title: '24-hour automatic purge',
      desc: 'Every transfer room and stored file is completely deleted after 24 hours. Zero residue, guaranteed ephemeral.',
    },
    {
      icon: <Lock className="w-4 h-4 text-accent" />,
      title: 'Private bucket storage',
      desc: 'Files are kept in private cloud buckets. Downloads require short-lived cryptographic signed URLs.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-accent" />,
      title: 'Hardened security & rate limits',
      desc: 'Hashed session tokens, path traversal sanitization, and sliding-window rate limiters prevent enumeration.',
    },
    {
      icon: <Globe className="w-4 h-4 text-accent" />,
      title: 'Cross-platform transfer',
      desc: 'Works flawlessly between iOS, Android, macOS, Windows, and Linux via any modern mobile or desktop browser.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container-wide space-y-16">
        {/* Core Capabilities */}
        <div className="space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-accent">
              Platform Features
            </h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary-text">
              Engineered for velocity, security, and simplicity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="p-6 rounded-xl border border-sb-border bg-surface shadow-card space-y-3"
              >
                <div className="w-8 h-8 rounded-lg bg-accent-light border border-indigo-100 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-semibold text-primary-text">{feat.title}</h3>
                <p className="text-xs text-secondary-text leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supported File Types Showcase */}
        <div className="p-8 rounded-2xl border border-sb-border bg-surface shadow-card space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider">
                <FileCode className="w-4 h-4" />
                <span>Zero File Restrictions</span>
              </div>
              <h3 className="text-lg font-bold text-primary-text">
                Universal file transfer compatibility
              </h3>
            </div>
            <p className="text-xs text-secondary-text max-w-md">
              SHAREBOX treats every byte neutrally. No conversion, no compression, and no format limitations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {supportedTypes.map((t) => (
              <div
                key={t.label}
                className="p-4 rounded-lg bg-background border border-sb-border space-y-1"
              >
                <div className="text-xs font-semibold text-primary-text">{t.label}</div>
                <div className="font-mono text-[11px] text-secondary-text truncate">
                  {t.exts}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
