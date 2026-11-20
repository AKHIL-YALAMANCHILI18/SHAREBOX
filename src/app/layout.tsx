import type { Metadata, Viewport } from 'next';
import { Footer } from '@/components/layout/footer';
import { DeveloperIntroBanner } from '@/components/layout/dev-intro-banner';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAFAFA',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sharebox-tau.vercel.app'),
  title: {
    default: 'SHAREBOX | Secure File Transfer',
    template: '%s | SHAREBOX',
  },
  description:
    'Universal code-based file transfer platform. Transfer files of any format securely with 8-digit numeric codes, real-time peer sync, and automatic 24-hour expiration.',
  keywords: [
    'SHAREBOX',
    'secure file transfer',
    'code file share',
    'universal file sharing',
    'ephemeral file transfer',
    'realtime sync',
    'private transfer',
    'temporary file room',
  ],
  authors: [{ name: 'Akhil Y', url: 'https://portfolio-akhil-3e53.vercel.app' }],
  creator: 'Akhil Y',
  publisher: 'SHAREBOX',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'SHAREBOX | Secure File Transfer',
    description:
      'Transfer anything. Anywhere. Universal code-based file transfer with real-time sync and 24-hour automatic expiration.',
    url: 'https://sharebox-tau.vercel.app',
    siteName: 'SHAREBOX',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SHAREBOX — Universal, ephemeral code-based file transfer',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SHAREBOX | Secure File Transfer',
    description:
      'Transfer anything. Anywhere. Universal code-based file transfer with real-time sync and 24-hour expiration.',
    images: ['/og-image.png'],
    creator: '@akhil_y',
  },
  alternates: {
    canonical: 'https://sharebox-tau.vercel.app',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-primary-text antialiased selection:bg-accent/15 selection:text-accent">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <DeveloperIntroBanner />
      </body>
    </html>
  );
}
