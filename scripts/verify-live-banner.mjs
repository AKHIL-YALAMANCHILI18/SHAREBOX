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

  let found = false;
  for (const s of scripts) {
    const res = await fetch(`https://sharebox-tau.vercel.app${s}`);
    const code = await res.text();
    if (code.includes('Hey, I') && code.includes('Akhil')) {
      found = true;
      console.log(`✓ Found Developer Intro Banner in client bundle: ${s}`);
      console.log(`  - Has Heading: ${code.includes("Hey, I'm Akhil!") || code.includes("Hey, I\\x27m Akhil!") || code.includes("Akhil")}`);
      console.log(`  - Has Contribute on GitHub: ${code.includes('Contribute on GitHub')}`);
      console.log(`  - Has Contact me: ${code.includes('Contact me')}`);
      console.log(`  - Has GitHub repo URL: ${code.includes('https://github.com/AKHIL-YALAMANCHILI18/SHAREBOX')}`);
      console.log(`  - Has Email mailto: ${code.includes('mailto:akhilyalamanchilii@gmail.com')}`);
      console.log(`  - Has LinkedIn URL: ${code.includes('https://www.linkedin.com/in/akhil-y-b97b55289/')}`);
      console.log(`  - Has 7-day storage key: ${code.includes('sharebox_dev_intro_dismissed_until')}`);
      console.log(`  - Has Close button aria-label: ${code.includes('Close developer introduction')}`);
      break;
    }
  }

  if (!found) {
    console.error('Developer Intro Banner was not found in bundles!');
    process.exit(1);
  }
}

verify().catch(console.error);
