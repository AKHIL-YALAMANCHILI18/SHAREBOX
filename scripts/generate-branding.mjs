import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ImageResponse } = require('next/og');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

// Cube Icon SVG component for ImageResponse
function CubeLogo({ size = 24, strokeColor = '#818CF8', strokeWidth = 2 }) {
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      style: { display: 'flex' },
    },
    React.createElement('path', {
      d: 'M12 3.3L20.7 8.3L12 13.3L3.3 8.3Z',
      fill: '#6366F1',
      fillOpacity: '0.4',
    }),
    React.createElement('path', {
      d: 'M3.3 8.3L12 13.3V22L3.3 17Z',
      fill: '#6366F1',
      fillOpacity: '0.2',
    }),
    React.createElement('path', {
      d: 'M12 13.3L20.7 8.3V17L12 22Z',
      fill: '#6366F1',
      fillOpacity: '0.28',
    }),
    React.createElement('path', {
      d: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
      stroke: strokeColor,
      strokeWidth: String(strokeWidth),
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    React.createElement('path', {
      d: 'm3.3 7 8.7 5 8.7-5',
      stroke: strokeColor,
      strokeWidth: String(strokeWidth),
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    }),
    React.createElement('path', {
      d: 'M12 22V12',
      stroke: strokeColor,
      strokeWidth: String(strokeWidth),
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    })
  );
}

// Favicon container
function FaviconComponent({ dimension }) {
  const cubeSize = Math.round(dimension * 0.65);
  const strokeWidth = dimension <= 32 ? 2.2 : 2;
  const borderRadius = Math.round(dimension * 0.22);

  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#18181B',
        borderRadius: `${borderRadius}px`,
        border: '1px solid #27272A',
      },
    },
    React.createElement(CubeLogo, {
      size: cubeSize,
      strokeColor: '#818CF8',
      strokeWidth,
    })
  );
}

// Open Graph 1200x630 branded image
function OpenGraphComponent() {
  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090B',
        backgroundImage:
          'radial-gradient(circle at 50% 25%, rgba(99, 102, 241, 0.22) 0%, transparent 65%)',
        position: 'relative',
        padding: '60px 80px',
        fontFamily: 'sans-serif',
      },
    },
    // Top border subtle glow line
    React.createElement('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #6366F1, #818CF8, #A5B4FC, #6366F1)',
      },
    }),
    // Center logo badge
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '110px',
          height: '110px',
          borderRadius: '28px',
          backgroundColor: '#18181B',
          border: '2px solid #27272A',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.25)',
          marginBottom: '32px',
        },
      },
      React.createElement(CubeLogo, {
        size: 68,
        strokeColor: '#818CF8',
        strokeWidth: 2,
      })
    ),
    // App Name
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          fontSize: '64px',
          fontWeight: 800,
          letterSpacing: '-1.5px',
          color: '#FFFFFF',
          marginBottom: '12px',
        },
      },
      'SHAREBOX'
    ),
    // Tagline
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          fontSize: '28px',
          fontWeight: 500,
          color: '#A1A1AA',
          marginBottom: '40px',
        },
      },
      'Transfer anything. Anywhere.'
    ),
    // Feature Pills
    React.createElement(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        },
      },
      [
        '8-Digit Room Codes',
        'Universal File Transfer',
        'Real-Time Sync',
        '24h Ephemeral Security',
      ].map((feature, i) =>
        React.createElement(
          'div',
          {
            key: i,
            style: {
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: '#18181B',
              border: '1px solid #27272A',
              color: '#E4E4E7',
              fontSize: '15px',
              fontWeight: 500,
            },
          },
          feature
        )
      )
    ),
    // Bottom domain watermark
    React.createElement(
      'div',
      {
        style: {
          position: 'absolute',
          bottom: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#71717A',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
      'sharebox-tau.vercel.app • Designed & Developed by Akhil Y'
    )
  );
}

// Build standard ICO file containing one or more PNG buffers
function buildIco(images) {
  // images: array of { width, height, buffer }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = ico)
  header.writeUInt16LE(count, 4); // image count

  let currentOffset = 6 + 16 * count;
  const dirEntries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette count (0 = no palette)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // offset in file

    dirEntries.push(entry);
    buffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...buffers]);
}

async function main() {
  console.log('Generating branded favicon and metadata assets...');

  // 1. Generate 32x32 PNG
  const res32 = new ImageResponse(React.createElement(FaviconComponent, { dimension: 32 }), {
    width: 32,
    height: 32,
  });
  const buf32 = Buffer.from(await res32.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buf32);
  console.log('✓ Created public/favicon-32x32.png (' + buf32.length + ' bytes)');

  // 2. Generate 16x16 PNG
  const res16 = new ImageResponse(React.createElement(FaviconComponent, { dimension: 16 }), {
    width: 16,
    height: 16,
  });
  const buf16 = Buffer.from(await res16.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), buf16);
  console.log('✓ Created public/favicon-16x16.png (' + buf16.length + ' bytes)');

  // 3. Generate multi-resolution favicon.ico (32x32 + 16x16)
  const icoBuf = buildIco([
    { width: 32, height: 32, buffer: buf32 },
    { width: 16, height: 16, buffer: buf16 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log('✓ Created public/favicon.ico (' + icoBuf.length + ' bytes)');

  // 4. Generate Apple Touch Icon (180x180)
  const res180 = new ImageResponse(React.createElement(FaviconComponent, { dimension: 180 }), {
    width: 180,
    height: 180,
  });
  const buf180 = Buffer.from(await res180.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buf180);
  console.log('✓ Created public/apple-touch-icon.png (' + buf180.length + ' bytes)');

  // 5. Generate Android Chrome 192x192
  const res192 = new ImageResponse(React.createElement(FaviconComponent, { dimension: 192 }), {
    width: 192,
    height: 192,
  });
  const buf192 = Buffer.from(await res192.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), buf192);
  console.log('✓ Created public/android-chrome-192x192.png (' + buf192.length + ' bytes)');

  // 6. Generate Android Chrome 512x512
  const res512 = new ImageResponse(React.createElement(FaviconComponent, { dimension: 512 }), {
    width: 512,
    height: 512,
  });
  const buf512 = Buffer.from(await res512.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), buf512);
  console.log('✓ Created public/android-chrome-512x512.png (' + buf512.length + ' bytes)');

  // 7. Generate Open Graph / Twitter Preview Image (1200x630)
  const resOg = new ImageResponse(React.createElement(OpenGraphComponent), {
    width: 1200,
    height: 630,
  });
  const bufOg = Buffer.from(await resOg.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), bufOg);
  console.log('✓ Created public/og-image.png (' + bufOg.length + ' bytes)');

  // 8. Generate site.webmanifest
  const manifest = {
    name: 'SHAREBOX — Secure File Transfer',
    short_name: 'SHAREBOX',
    description:
      'Universal code-based file transfer platform. Transfer any file securely with real-time sync and 24-hour expiration.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#FAFAFA',
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('✓ Created public/site.webmanifest');

  console.log('All branding assets generated successfully!');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
