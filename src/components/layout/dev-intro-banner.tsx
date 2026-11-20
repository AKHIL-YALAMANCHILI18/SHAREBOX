'use client';

import React, { useState, useEffect } from 'react';
import { Box, Github, Mail, Linkedin, X } from 'lucide-react';

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const STORAGE_KEY = 'sharebox_dev_intro_dismissed_until';
const SESSION_KEY = 'sharebox_dev_intro_session_dismissed';

export function DeveloperIntroBanner() {
  const [isRendered, setIsRendered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Safety check for SSR environment
    if (typeof window === 'undefined') return;

    try {
      // 2. Check if dismissed within the 7-day window
      const dismissedUntil = localStorage.getItem(STORAGE_KEY);
      if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
        return;
      }

      // 3. Check if already dismissed during this active session
      const sessionDismissed = sessionStorage.getItem(SESSION_KEY);
      if (sessionDismissed === 'true') {
        return;
      }
    } catch {
      // Gracefully continue if localStorage is inaccessible
    }

    // 4. Trigger display after a 3.5s non-intrusive delay
    const timer = setTimeout(() => {
      setIsRendered(true);
      // Small frame delay to ensure smooth CSS transition from initial state
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        (Date.now() + DISMISS_DURATION_MS).toString()
      );
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // Ignore storage write errors
    }

    // Unmount after smooth exit animation
    setTimeout(() => {
      setIsRendered(false);
    }, 400);
  };

  if (!isRendered) return null;

  return (
    <aside
      aria-label="Creator introduction"
      className={`fixed z-50 bottom-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 max-w-sm w-auto sm:w-[380px] bg-surface/95 backdrop-blur-md border border-sb-border rounded-2xl p-4 shadow-elevated transition-all duration-500 ease-out motion-reduce:transition-none ${
        isOpen
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      {/* Header: SHAREBOX Cube Badge + Creator Greeting + Close Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-text flex items-center justify-center text-white shadow-subtle shrink-0">
            <Box className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary-text tracking-tight flex items-center gap-1.5">
              <span>Hey, I&apos;m Akhil!</span>
              <span className="inline-block animate-bounce origin-bottom text-xs">👋</span>
            </h4>
            <span className="text-[11px] text-secondary-text font-medium">
              Creator of SHAREBOX
            </span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Close developer introduction"
          className="text-secondary-text hover:text-primary-text p-1 rounded-md hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent -mr-1 -mt-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Friendly Personal Message */}
      <p className="text-xs text-secondary-text leading-relaxed mt-2.5">
        I built SHAREBOX to make file sharing simple and accessible. Have an
        idea, feedback, or want to contribute? I&apos;d love to hear from you!
      </p>

      {/* Creator Action Links */}
      <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-sb-border/60">
        <a
          href="https://github.com/AKHIL-YALAMANCHILI18/SHAREBOX"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDismiss}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-text hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-subtle hover:scale-[1.02] active:scale-[0.98]"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Contribute on GitHub</span>
        </a>

        <a
          href="mailto:akhilyalamanchilii@gmail.com"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-surface hover:bg-zinc-50 hover:border-zinc-300 text-primary-text text-xs font-medium transition-all shadow-subtle"
        >
          <Mail className="w-3.5 h-3.5 text-zinc-500" />
          <span>Contact me</span>
        </a>

        <a
          href="https://www.linkedin.com/in/akhil-y-b97b55289/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-secondary-text hover:text-[#0A66C2] text-xs font-medium transition-colors ml-auto"
          title="Connect with Akhil Y on LinkedIn"
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">LinkedIn</span>
        </a>
      </div>
    </aside>
  );
}
