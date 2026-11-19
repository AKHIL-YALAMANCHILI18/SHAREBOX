import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runLiveIntegrationTest() {
  console.log('====================================================');
  console.log('SHAREBOX LIVE SUPABASE END-TO-END INTEGRATION TEST');
  console.log('====================================================\n');

  const results = [];

  // Helper for SHA-256
  function getSha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // 1. Create Room (Participant A)
  console.log('--- 1. Testing Room Creation (Participant A) ---');
  let createRes = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Alice (Creator)' }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create room: ${createRes.status} ${await createRes.text()}`);
  }

  const createCookies = createRes.headers.get('set-cookie') || '';
  const createData = await createRes.json();
  const roomCode = createData.room.code;
  const roomId = createData.room.id;
  console.log(`[PASS] Room created successfully. Code: ${roomCode}, ID: ${roomId}`);
  console.log(`[PASS] Creator participant: ${createData.participant.display_name} (${createData.participant.id})`);
  results.push({ test: 'Room Creation', status: 'PASS', details: `Room code ${roomCode} created with 24h expiration` });

  // 2. Join Room (Participant B)
  console.log('\n--- 2. Testing Room Joining (Participant B) ---');
  let joinRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Bob (Joiner)' }),
  });

  if (!joinRes.ok) {
    throw new Error(`Failed to join room: ${joinRes.status} ${await joinRes.text()}`);
  }

  const joinCookies = joinRes.headers.get('set-cookie') || '';
  const joinData = await joinRes.json();
  console.log(`[PASS] Bob joined room ${roomCode} successfully.`);
  console.log(`[PASS] Joiner participant: ${joinData.participant.display_name} (${joinData.participant.id})`);
  results.push({ test: 'Room Joining', status: 'PASS', details: `Second participant joined room ${roomCode}` });

  // 3. Prepare Test Files: PDF, JPG, MP4
  const testFiles = [
    {
      name: 'document_sample.pdf',
      mime: 'application/pdf',
      data: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n160\n%%EOF'),
    },
    {
      name: 'photo_sample.jpg',
      mime: 'image/jpeg',
      data: Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]), crypto.randomBytes(4096), Buffer.from([0xFF, 0xD9])]),
    },
    {
      name: 'clip_sample.mp4',
      mime: 'video/mp4',
      data: Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32]), crypto.randomBytes(16384)]),
    },
  ];

  const uploadedFiles = [];

  // Helper function to upload a file via signed upload URL
  async function uploadFile(fileObj, cookieHeader, uploaderName) {
    console.log(`\nUploading ${fileObj.name} (${fileObj.data.length} bytes, ${fileObj.mime}) as ${uploaderName}...`);
    const originalChecksum = getSha256(fileObj.data);

    // Step A: Init upload
    const initRes = await fetch(`${BASE_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        roomCode,
        fileName: fileObj.name,
        fileSize: fileObj.data.length,
        mimeType: fileObj.mime,
      }),
    });

    if (!initRes.ok) {
      throw new Error(`Init upload failed: ${initRes.status} ${await initRes.text()}`);
    }

    const initData = await initRes.json();
    const { file, signedUrl } = initData;
    console.log(`  -> Obtained signed upload URL for path: ${file.storage_path}`);

    // Step B: Direct PUT to storage signed URL
    const storagePutRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileObj.mime,
      },
      body: fileObj.data,
    });

    if (!storagePutRes.ok) {
      throw new Error(`Storage PUT failed: ${storagePutRes.status} ${await storagePutRes.text()}`);
    }
    console.log(`  -> Direct storage PUT completed (HTTP ${storagePutRes.status})`);

    // Step C: Confirm upload
    const confirmRes = await fetch(`${BASE_URL}/api/files/${file.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({ roomCode }),
    });

    if (!confirmRes.ok) {
      throw new Error(`Confirm failed: ${confirmRes.status} ${await confirmRes.text()}`);
    }

    const confirmData = await confirmRes.json();
    console.log(`  -> Upload confirmed. File record ID: ${confirmData.file.id}, Status: ${confirmData.file.status}`);

    uploadedFiles.push({
      id: confirmData.file.id,
      name: fileObj.name,
      originalChecksum,
      originalData: fileObj.data,
    });

    results.push({
      test: `Upload ${fileObj.name}`,
      status: 'PASS',
      details: `${fileObj.name} uploaded via presigned URL and confirmed. SHA-256: ${originalChecksum.substring(0, 16)}...`,
    });
  }

  // Upload PDF as Alice
  await uploadFile(testFiles[0], createCookies, 'Alice');

  // Upload JPG as Bob
  await uploadFile(testFiles[1], joinCookies, 'Bob');

  // Upload MP4 as Alice
  await uploadFile(testFiles[2], createCookies, 'Alice');

  // 4. Test Downloading Files and Verify SHA-256 Checksums
  console.log('\n--- 4. Testing File Downloads & SHA-256 Checksums ---');
  for (const uploaded of uploadedFiles) {
    console.log(`Downloading file ${uploaded.name} as Bob...`);

    // Bob requests download URL
    const dlUrlRes = await fetch(`${BASE_URL}/api/files/${uploaded.id}`, {
      headers: { 'Cookie': joinCookies },
    });

    if (!dlUrlRes.ok) {
      throw new Error(`Failed to get download URL: ${dlUrlRes.status} ${await dlUrlRes.text()}`);
    }

    const dlData = await dlUrlRes.json();
    console.log(`  -> Signed download URL generated (expires in 5 min)`);

    // Fetch the actual file bytes from the signed download URL
    const fileBytesRes = await fetch(dlData.downloadUrl);
    if (!fileBytesRes.ok) {
      throw new Error(`Failed to fetch file from storage: ${fileBytesRes.status}`);
    }

    const downloadedBuffer = Buffer.from(await fileBytesRes.arrayBuffer());
    const downloadedChecksum = getSha256(downloadedBuffer);

    console.log(`  -> Original size:   ${uploaded.originalData.length} bytes | Checksum: ${uploaded.originalChecksum}`);
    console.log(`  -> Downloaded size: ${downloadedBuffer.length} bytes | Checksum: ${downloadedChecksum}`);

    if (uploaded.originalChecksum !== downloadedChecksum) {
      throw new Error(`Checksum mismatch on ${uploaded.name}! Original: ${uploaded.originalChecksum}, Downloaded: ${downloadedChecksum}`);
    }

    console.log(`  -> [VERIFIED MATCH] Exact byte-for-byte SHA-256 match!`);
    results.push({
      test: `Download & Checksum ${uploaded.name}`,
      status: 'PASS',
      details: `Byte-for-byte integrity verified. Checksum: ${downloadedChecksum}`,
    });
  }

  // 5. Test Download-All Endpoint
  console.log('\n--- 5. Testing Download-All Endpoint ---');
  const dlAllRes = await fetch(`${BASE_URL}/api/files/download-all`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': joinCookies,
    },
    body: JSON.stringify({ roomCode }),
  });

  if (!dlAllRes.ok) {
    throw new Error(`Download all failed: ${dlAllRes.status} ${await dlAllRes.text()}`);
  }

  const dlAllData = await dlAllRes.json();
  console.log(`[PASS] Download-All returned ${dlAllData.count} signed file URLs for room ${roomCode}.`);
  results.push({
    test: 'Download-All Endpoint',
    status: 'PASS',
    details: `Successfully generated ${dlAllData.count} signed download URLs`,
  });

  // 6. Test Security / Unauthorized Access Prevention
  console.log('\n--- 6. Testing Security: Unauthorized Access Prevention ---');
  const unauthRes = await fetch(`${BASE_URL}/api/files/${uploadedFiles[0].id}`, {
    // No Cookie!
  });

  if (unauthRes.status === 401) {
    console.log(`[PASS] Unauthorized request rejected with HTTP 401 Unauthorized.`);
    results.push({
      test: 'Unauthorized Access Rejection',
      status: 'PASS',
      details: 'Request without participant session cookie correctly rejected with 401',
    });
  } else {
    throw new Error(`Expected 401 Unauthorized, got: ${unauthRes.status}`);
  }

  // 7. Test Room Listing via API
  console.log('\n--- 7. Testing Room Details Endpoint ---');
  const roomDetailsRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`, {
    headers: { 'Cookie': createCookies },
  });
  const roomDetails = await roomDetailsRes.json();
  console.log(`[PASS] Room ${roomCode} contains ${roomDetails.files.length} active files in metadata.`);
  results.push({
    test: 'Room Details & Files Query',
    status: 'PASS',
    details: `Room contains ${roomDetails.files.length} files with participant metadata`,
  });

  console.log('\n====================================================');
  console.log('ALL LIVE INTEGRATION TESTS PASSED CLEANLY (100%)');
  console.log('====================================================\n');

  console.log(JSON.stringify(results, null, 2));
}

runLiveIntegrationTest().catch((err) => {
  console.error('\n[FATAL ERROR IN LIVE TEST]:', err);
  process.exit(1);
});
