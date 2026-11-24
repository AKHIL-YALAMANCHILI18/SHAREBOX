import React from 'react';
import { Sparkles, UploadCloud, Share2, DownloadCloud } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create a room',
      description:
        'Instant creation in one click. Receive a secure 6-digit numeric room code with a 24-hour lifetime.',
      icon: <Sparkles className="w-5 h-5 text-accent" />,
    },
    {
      num: '02',
      title: 'Upload any file',
      description:
        'Drop videos, documents, binaries, code, or archives. Multi-file concurrent uploads with progress tracking.',
      icon: <UploadCloud className="w-5 h-5 text-accent" />,
    },
    {
      num: '03',
      title: 'Share the code',
      description:
        'Share the 6-digit code or direct link. No login or installation required for anyone to join.',
      icon: <Share2 className="w-5 h-5 text-accent" />,
    },
    {
      num: '04',
      title: 'Sync & download',
      description:
        'Both participants see new files in real time. Download individually or grab everything at once.',
      icon: <DownloadCloud className="w-5 h-5 text-accent" />,
    },
  ];

  return (
    <section className="py-16 md:py-24 border-b border-sb-border/60 bg-surface">
      <div className="container-wide">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12 md:mb-16">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-accent">
            How It Works
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary-text">
            Simple transfer in four effortless steps
          </p>
          <p className="text-sm text-secondary-text">
            No friction, no sign-up forms, no cloud storage limits to configure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative p-6 rounded-xl border border-sb-border bg-background/50 hover:bg-background transition-colors space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-surface border border-sb-border flex items-center justify-center shadow-subtle">
                  {step.icon}
                </div>
                <span className="font-mono text-xs font-bold text-zinc-300">
                  {step.num}
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-primary-text">
                  {step.title}
                </h3>
                <p className="text-xs text-secondary-text leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
