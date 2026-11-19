import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAFAFA',
};

export const metadata: Metadata = {
  title: 'SHAREBOX — Transfer anything. Anywhere.',
  description:
    'Universal code-based file transfer platform. Transfer any file securely using simple 8-digit codes with real-time sync and 24-hour automatic expiration.',
  keywords: [
    'file sharing',
    'file transfer',
    'secure sharing',
    'universal transfer',
    'code transfer',
    'realtime transfer',
  ],
  authors: [{ name: 'SHAREBOX' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-primary-text antialiased selection:bg-accent/15 selection:text-accent">
        {children}
      </body>
    </html>
  );
}
