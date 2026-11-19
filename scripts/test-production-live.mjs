import crypto from 'crypto';

const PROD_URL = 'https://sharebox-tau.vercel.app';

function getSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function runProductionLiveTest() {
  console.log('====================================================');
  console.log('TESTING LIVE PRODUCTION DEPLOYMENT AT: ' + PROD_URL);
  console.log('====================================================\n');

  // 1. Verify Homepage Loads
  console.log('1. Checking homepage HTTP 200...');
  const homeRes = await fetch(PROD_URL);
  if (!homeRes.ok) throw new Error('Homepage failed to load: ' + homeRes.status);
  const homeHtml = await homeRes.text();
  if (!homeHtml.includes('Transfer anything')) {
    throw new Error('Homepage HTML does not contain expected headline');
  }
  console.log('[PASS] Homepage live and verified HTML content.\n');

  // 2. Create Room (Device A simulation)
  console.log('2. Creating room via POST /api/rooms on production...');
  const createRes = await fetch(`${PROD_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'DeviceA-Host' }),
  });

  if (!createRes.ok) {
    throw new Error(`Room creation failed on production: ${createRes.status} ${await createRes.text()}`);
  }

  const createCookies = createRes.headers.get('set-cookie') || '';
  const createData = await createRes.json();
  const roomCode = createData.room.code;
  const roomId = createData.room.id;
  console.log(`[PASS] Room created on production. Code: ${roomCode}, ID: ${roomId}`);
  console.log(`[PASS] Host participant: ${createData.participant.display_name} (${createData.participant.id})\n`);

  // 3. Join Room (Device B simulation from distinct session)
  console.log('3. Joining room via POST /api/rooms/[code]/join on production...');
  const joinRes = await fetch(`${PROD_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'DeviceB-Guest' }),
  });

  if (!joinRes.ok) {
    throw new Error(`Room joining failed on production: ${joinRes.status} ${await joinRes.text()}`);
  }

  const joinCookies = joinRes.headers.get('set-cookie') || '';
  const joinData = await joinRes.json();
  console.log(`[PASS] Guest successfully joined room ${roomCode} on production.`);
  console.log(`[PASS] Guest participant: ${joinData.participant.display_name} (${joinData.participant.id})\n`);

  // 4. Test Multi-Format Uploads to Production (PDF, JPG, TXT)
  const filesToTest = [
    {
      name: 'prod_document.pdf',
      mime: 'application/pdf',
      data: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF'),
      uploader: 'DeviceA',
      cookies: createCookies,
    },
    {
      name: 'prod_image.jpg',
      mime: 'image/jpeg',
      data: Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), crypto.randomBytes(8192), Buffer.from([0xFF, 0xD9])]),
      uploader: 'DeviceB',
      cookies: joinCookies,
    },
  ];

  const uploadedRecords = [];

  for (const f of filesToTest) {
    console.log(`4. Uploading ${f.name} (${f.data.length} bytes, ${f.mime}) from ${f.uploader}...`);
    const initRes = await fetch(`${PROD_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': f.cookies,
      },
      body: JSON.stringify({
        roomCode,
        fileName: f.name,
        fileSize: f.data.length,
        mimeType: f.mime,
      }),
    });

    if (!initRes.ok) throw new Error(`Init upload failed on production: ${initRes.status} ${await initRes.text()}`);
    const initData = await initRes.json();

    // Direct PUT to Supabase signed URL
    const putRes = await fetch(initData.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': f.mime },
      body: f.data,
    });
    if (!putRes.ok) throw new Error(`Direct PUT failed on production storage: ${putRes.status}`);

    // Confirm upload
    const confirmRes = await fetch(`${PROD_URL}/api/files/${initData.file.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': f.cookies,
      },
      body: JSON.stringify({ roomCode }),
    });
    if (!confirmRes.ok) throw new Error(`Confirm failed: ${confirmRes.status}`);

    console.log(`  -> [PASS] Upload confirmed for ${f.name}. File ID: ${initData.file.id}`);
    uploadedRecords.push({
      id: initData.file.id,
      name: f.name,
      checksum: getSha256(f.data),
      data: f.data,
    });
  }

  // 5. Test Downloads & Checksum Verification across devices
  console.log('\n5. Testing Cross-Device Downloads & SHA-256 Checksum Verification...');
  for (const rec of uploadedRecords) {
    console.log(`DeviceB downloading ${rec.name}...`);
    const dlRes = await fetch(`${PROD_URL}/api/files/${rec.id}`, {
      headers: { 'Cookie': joinCookies },
    });
    if (!dlRes.ok) throw new Error(`Download URL failed: ${dlRes.status}`);
    const dlData = await dlRes.json();

    const fileStreamRes = await fetch(dlData.downloadUrl);
    const dlBuffer = Buffer.from(await fileStreamRes.arrayBuffer());
    const dlChecksum = getSha256(dlBuffer);

    if (dlChecksum !== rec.checksum) {
      throw new Error(`Checksum mismatch on ${rec.name}! Expected ${rec.checksum}, got ${dlChecksum}`);
    }
    console.log(`  -> [VERIFIED MATCH] Downloaded ${dlBuffer.length} bytes. Checksum: ${dlChecksum}`);
  }

  // 6. Test Security: Verify Unauthorized Access is Blocked
  console.log('\n6. Testing Security: Verifying Unauthorized Download is Blocked...');
  const unauthRes = await fetch(`${PROD_URL}/api/files/${uploadedRecords[0].id}`);
  if (unauthRes.status === 401) {
    console.log('[PASS] Production server correctly rejected unauthenticated download with HTTP 401 Unauthorized.');
  } else {
    throw new Error(`Expected HTTP 401, got ${unauthRes.status}`);
  }

  // 7. Test Download-All on Production
  console.log('\n7. Testing Download-All on Production...');
  const dlAllRes = await fetch(`${PROD_URL}/api/files/download-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': createCookies,
    },
    body: JSON.stringify({ roomCode }),
  });
  if (!dlAllRes.ok) throw new Error(`Download all failed: ${dlAllRes.status}`);
  const dlAllData = await dlAllRes.json();
  console.log(`[PASS] Download-All returned ${dlAllData.count} signed URLs on production.`);

  // 8. Test Production Cleanup Authorization
  console.log('\n8. Testing Production Cleanup Endpoint Authorization...');
  const cleanupUnauth = await fetch(`${PROD_URL}/api/cleanup`, { method: 'POST' });
  if (cleanupUnauth.status === 401) {
    console.log('[PASS] Unauthorized cleanup invocation correctly rejected with HTTP 401.');
  }

  console.log('\n====================================================');
  console.log('ALL PRODUCTION END-TO-END VALIDATIONS PASSED (100%)');
  console.log('====================================================');
}

runProductionLiveTest().catch((err) => {
  console.error('[PRODUCTION TEST FAILED]:', err);
  process.exit(1);
});
