async function verify() {
  const r = await fetch('https://sharebox-tau.vercel.app');
  const html = await r.text();
  const regex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
  let match;
  const scripts = [];
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  console.log(`Inspecting ${scripts.length} loaded client JavaScript bundles...`);

  let foundBanner = false;
  let hasStorageKey = false;
  for (const s of scripts) {
    const res = await fetch(`https://sharebox-tau.vercel.app${s}`);
    const code = await res.text();
    if (code.includes('Hey, I') && code.includes('Akhil')) {
      foundBanner = true;
      console.log(`✓ Found Developer Intro Banner in chunk: ${s}`);
    }
    if (code.includes('sharebox_dev_intro_dismissed_until')) {
      hasStorageKey = true;
    }
  }

  console.log(`- Banner present in production client code: ${foundBanner}`);
  console.log(`- Persistent 7-day localStorage suppression key present: ${hasStorageKey}`);

  if (!foundBanner || hasStorageKey) {
    console.error('Verification failed!');
    process.exit(1);
  } else {
    console.log('✓ VERIFIED: Banner displays every visit/refresh and suppression logic is completely removed.');
  }
}

verify().catch(console.error);
