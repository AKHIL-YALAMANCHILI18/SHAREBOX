import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cleanupSecret = process.env.CLEANUP_SECRET;

const supabase = createClient(supabaseUrl, serviceKey);

async function testRealCleanup() {
  console.log('--- CRON CLEANUP VERIFICATION TEST ---');

  // 1. Create a dummy expired room in the database
  const dummyCode = '99999999';
  const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25 hours ago

  // Clean any leftover
  await supabase.from('rooms').delete().eq('code', dummyCode);

  const { data: room, error: roomErr } = await supabase
    .from('rooms')
    .insert({
      code: dummyCode,
      created_at: pastDate,
      expires_at: pastDate,
      is_active: true,
    })
    .select()
    .single();

  if (roomErr || !room) {
    throw new Error('Failed to create test expired room: ' + roomErr?.message);
  }

  console.log(`[OK] Created test expired room ID: ${room.id}, Code: ${room.code}`);

  // 2. Create dummy participant
  const tokenHash = crypto.createHash('sha256').update('dummy').digest('hex');
  const { data: part, error: partErr } = await supabase
    .from('participants')
    .insert({
      room_id: room.id,
      display_name: 'ExpiredBot',
      session_token_hash: tokenHash,
      is_active: true,
    })
    .select()
    .single();

  if (partErr || !part) {
    throw new Error('Failed to insert participant: ' + partErr?.message);
  }

  // 3. Upload a dummy test file to storage under this room's path
  const storagePath = `rooms/${room.id}/dummy_file_id/expired_test.txt`;
  const { error: uploadErr } = await supabase.storage
    .from('sharebox-files')
    .upload(storagePath, Buffer.from('This file should be deleted by cleanup'), {
      contentType: 'text/plain',
      upsert: true,
    });

  if (uploadErr) {
    throw new Error('Failed to upload dummy test file to storage: ' + uploadErr.message);
  }
  console.log(`[OK] Uploaded test file to storage at: ${storagePath}`);

  // 4. Record file in database
  const { data: fileRec, error: fileErr } = await supabase
    .from('files')
    .insert({
      room_id: room.id,
      participant_id: part.id,
      original_name: 'expired_test.txt',
      sanitized_name: 'expired_test.txt',
      storage_path: storagePath,
      mime_type: 'text/plain',
      size: 38,
      status: 'completed',
    })
    .select()
    .single();

  if (fileErr || !fileRec) {
    throw new Error('Failed to record file in database: ' + fileErr?.message);
  }

  // Verify file exists in storage before cleanup
  const { data: listBefore } = await supabase.storage
    .from('sharebox-files')
    .list(`rooms/${room.id}/dummy_file_id`);
  if (!listBefore || listBefore.length === 0) {
    throw new Error('Pre-condition failed: file not found in storage before cleanup');
  }
  console.log(`[OK] Pre-condition verified: file exists in storage prior to cleanup invocation.`);

  // 5. Invoke the actual /api/cleanup endpoint via HTTP
  console.log('Invoking POST http://localhost:3000/api/cleanup with secret...');
  const res = await fetch('http://localhost:3000/api/cleanup', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cleanupSecret}`,
    },
  });

  const cleanupRes = await res.json();
  console.log('Cleanup endpoint response:', cleanupRes);

  if (!cleanupRes.success || cleanupRes.cleanedRooms === 0) {
    throw new Error('Cleanup API did not clean the expired room: ' + JSON.stringify(cleanupRes));
  }

  // 6. Verify Post-condition 1: Room is deactivated
  const { data: roomAfter } = await supabase
    .from('rooms')
    .select('is_active')
    .eq('id', room.id)
    .single();

  if (roomAfter.is_active !== false) {
    throw new Error('Post-condition 1 failed: room is still active in database!');
  }
  console.log(`[VERIFIED] Room status in database is now is_active = false.`);

  // 7. Verify Post-condition 2: Storage object is actually DELETED
  const { data: listAfter } = await supabase.storage
    .from('sharebox-files')
    .list(`rooms/${room.id}/dummy_file_id`);

  if (listAfter && listAfter.length > 0) {
    throw new Error('Post-condition 2 failed: storage file was NOT deleted by cleanup!');
  }
  console.log(`[VERIFIED] Storage object ${storagePath} was genuinely and permanently deleted from bucket.`);

  // Clean test room row
  await supabase.from('rooms').delete().eq('id', room.id);
  console.log('\n--- ALL CLEANUP VERIFICATION TESTS PASSED (100% PROVEN) ---');
}

testRealCleanup().catch((err) => {
  console.error('[CLEANUP TEST FAILED]:', err);
  process.exit(1);
});
