import React from 'react';
import { Box, Lock, Shield, Clock, Heart, Mail, Linkedin, Github, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-sb-border bg-surface py-10 mt-auto">
      <div className="container-wide space-y-8">
        {/* Top row: Brand + Security Features */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-text flex items-center justify-center text-white shadow-subtle">
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

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-secondary-text">
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

        {/* Middle row: Developer Credit & Profile Links */}
        <div className="pt-6 border-t border-sb-border/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-primary-text">
            <span>Designed &amp; Developed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block transition-transform hover:scale-125 duration-200" />
            <span>by</span>
            <a
              href="https://portfolio-akhil-3e53.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary-text hover:text-accent transition-colors"
              title="Akhil Y Portfolio"
            >
              Akhil Y
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
            <a
              href="https://portfolio-akhil-3e53.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-background/50 hover:bg-background hover:border-zinc-300 text-secondary-text hover:text-primary-text transition-all duration-150 shadow-subtle group"
              title="Akhil Y Portfolio"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400 group-hover:text-accent transition-colors" />
              <span className="text-[11px] font-medium">Portfolio</span>
            </a>

            <a
              href="https://github.com/AKHIL-YALAMANCHILI18"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-background/50 hover:bg-background hover:border-zinc-300 text-secondary-text hover:text-primary-text transition-all duration-150 shadow-subtle group"
              title="Akhil Y on GitHub"
            >
              <Github className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary-text transition-colors" />
              <span className="text-[11px] font-medium">GitHub</span>
            </a>

            <a
              href="https://www.linkedin.com/in/akhil-y-b97b55289/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-background/50 hover:bg-background hover:border-zinc-300 text-secondary-text hover:text-primary-text transition-all duration-150 shadow-subtle group"
              title="Akhil Y on LinkedIn"
            >
              <Linkedin className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#0A66C2] transition-colors" />
              <span className="text-[11px] font-medium">LinkedIn</span>
            </a>

            <a
              href="mailto:akhilyalamanchilii@gmail.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-background/50 hover:bg-background hover:border-zinc-300 text-secondary-text hover:text-primary-text transition-all duration-150 shadow-subtle group"
              title="Contact Akhil Y via Email"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400 group-hover:text-accent transition-colors" />
              <span className="text-[11px] font-medium">akhilyalamanchilii@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Bottom row: Copyright & Platform Notice */}
        <div className="pt-4 border-t border-sb-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <p>© 2026 SHAREBOX. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>Ephemeral storage</span>
            <span>•</span>
            <span>Zero retention after 24h</span>
            <span>•</span>
            <span>Direct transfer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
