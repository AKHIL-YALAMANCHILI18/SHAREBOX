async function verify() {
  const htmlRes = await fetch('https://sharebox-tau.vercel.app');
  const html = await htmlRes.text();

  console.log('--- HTML HEAD INSPECTION ---');
  console.log('Title match:', html.match(/<title>([^<]*)<\/title>/)?.[0]);
  console.log('OG title:', html.match(/<meta property="og:title" content="([^"]*)"/)?.[0]);
  console.log('OG description:', html.match(/<meta property="og:description" content="([^"]*)"/)?.[0]);
  console.log('OG image:', html.match(/<meta property="og:image" content="([^"]*)"/)?.[0]);
  console.log('Twitter card:', html.match(/<meta name="twitter:card" content="([^"]*)"/)?.[0]);
  console.log('Twitter image:', html.match(/<meta name="twitter:image" content="([^"]*)"/)?.[0]);
  console.log('Icon link:', html.match(/<link rel="icon" [^>]*>/g));
  console.log('Apple touch icon:', html.match(/<link rel="apple-touch-icon" [^>]*>/g));
  console.log('Manifest:', html.match(/<link rel="manifest" [^>]*>/g));

  console.log('\n--- ASSET HTTP STATUS CHECKS ---');
  const assets = [
    '/favicon.ico',
    '/icon.svg',
    '/apple-touch-icon.png',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/og-image.png',
    '/site.webmanifest',
  ];
  for (const asset of assets) {
    const r = await fetch('https://sharebox-tau.vercel.app' + asset);
    const len = (await r.arrayBuffer()).byteLength;
    console.log(asset, '-> HTTP', r.status, 'Content-Type:', r.headers.get('content-type'), 'Size:', len, 'bytes');
  }
}

verify().catch(console.error);
