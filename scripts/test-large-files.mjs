import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

function getSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function runLargeFileTests() {
  console.log('--- PROGRESSIVE LARGE FILE & INTERRUPTION RECOVERY TEST ---');

  // 1. Create room
  const createRes = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'LargeFileTester' }),
  });
  const createCookies = createRes.headers.get('set-cookie') || '';
  const createData = await createRes.json();
  const roomCode = createData.room.code;
  console.log(`[OK] Room created for large file test: ${roomCode}`);

  const sizes = [
    { label: '1 MB', bytes: 1 * 1024 * 1024 },
    { label: '5 MB', bytes: 5 * 1024 * 1024 },
    { label: '15 MB', bytes: 15 * 1024 * 1024 },
    { label: '25 MB', bytes: 25 * 1024 * 1024 },
  ];

  for (const s of sizes) {
    console.log(`\nTesting progressive upload: ${s.label} (${s.bytes} bytes)...`);
    const buffer = crypto.randomBytes(s.bytes);
    const originalChecksum = getSha256(buffer);
    const fileName = `test_payload_${s.label.replace(' ', '_')}.bin`;

    // Init
    const initRes = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': createCookies,
      },
      body: JSON.stringify({
        roomCode,
        fileName,
        fileSize: s.bytes,
        mimeType: 'application/octet-stream',
      }),
    });

    if (!initRes.ok) {
      throw new Error(`Init failed for ${s.label}: ${initRes.status} ${await initRes.text()}`);
    }

    const { file, signedUrl } = await initRes.json();

    // Stream upload directly to signed URL
    const startTime = Date.now();
    const putRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer,
    });

    if (!putRes.ok) {
      throw new Error(`Storage PUT failed for ${s.label}: ${putRes.status}`);
    }
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`  -> Direct upload completed in ${duration}s`);

    // Confirm
    const confirmRes = await fetch(`${BASE_URL}/api/files/${file.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': createCookies,
      },
      body: JSON.stringify({ roomCode }),
    });

    if (!confirmRes.ok) {
      throw new Error(`Confirm failed for ${s.label}: ${confirmRes.status}`);
    }
    console.log(`  -> File confirmed in database.`);

    // Download & Verify
    const dlRes = await fetch(`${BASE_URL}/api/files/${file.id}`, {
      headers: { 'Cookie': createCookies },
    });
    const dlData = await dlRes.json();
    const downloadRes = await fetch(dlData.downloadUrl);
    const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
    const downloadedChecksum = getSha256(downloadedBuf);

    if (downloadedChecksum !== originalChecksum) {
      throw new Error(`Checksum mismatch on ${s.label}!`);
    }
    console.log(`  -> [VERIFIED MATCH] Downloaded ${downloadedBuf.length} bytes. Checksum: ${downloadedChecksum.substring(0, 16)}...`);
  }

  // 2. Test Interrupted Upload & Retry
  console.log('\n--- Testing Interruption & Retry Simulation ---');
  const interruptData = crypto.randomBytes(512 * 1024);
  const interruptChecksum = getSha256(interruptData);
  const interruptFileName = 'interrupted_recovery.bin';

  // Attempt 1: Start upload, but abort controller cancels it midway
  console.log('Initiating upload session 1...');
  const init1 = await fetch(`${BASE_URL}/api/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': createCookies },
    body: JSON.stringify({ roomCode, fileName: interruptFileName, fileSize: interruptData.length, mimeType: 'application/octet-stream' }),
  });
  const init1Data = await init1.json();

  const controller = new AbortController();
  const putPromise = fetch(init1Data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: interruptData,
    signal: controller.signal,
  });

  // Abort immediately to simulate network cutoff
  controller.abort();
  try {
    await putPromise;
    console.warn('Upload was not interrupted');
  } catch (err) {
    console.log(`  -> [SIMULATED NETWORK DROP]: Upload aborted as expected: ${err.message}`);
  }

  // Attempt 2: Retry flow (client re-initiates and completes)
  console.log('Attempting retry upload (fresh session)...');
  const init2 = await fetch(`${BASE_URL}/api/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': createCookies },
    body: JSON.stringify({ roomCode, fileName: interruptFileName, fileSize: interruptData.length, mimeType: 'application/octet-stream' }),
  });
  const init2Data = await init2.json();

  const put2 = await fetch(init2Data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: interruptData,
  });
  if (!put2.ok) throw new Error('Retry PUT failed');

  await fetch(`${BASE_URL}/api/files/${init2Data.file.id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': createCookies },
    body: JSON.stringify({ roomCode }),
  });

  const dl2 = await fetch(`${BASE_URL}/api/files/${init2Data.file.id}`, { headers: { 'Cookie': createCookies } });
  const dl2Data = await dl2.json();
  const dlBytes2 = Buffer.from(await (await fetch(dl2Data.downloadUrl)).arrayBuffer());
  const finalChecksum = getSha256(dlBytes2);

  if (finalChecksum !== interruptChecksum) {
    throw new Error('Checksum mismatch after retry!');
  }
  console.log(`  -> [RECOVERY VERIFIED] Retried upload succeeded and matches byte-for-byte! Checksum: ${finalChecksum}`);

  console.log('\n--- ALL LARGE FILE & INTERRUPTION TESTS PASSED CLEANLY ---');
}

runLargeFileTests().catch((err) => {
  console.error('[LARGE FILE TEST FAILED]:', err);
  process.exit(1);
});
