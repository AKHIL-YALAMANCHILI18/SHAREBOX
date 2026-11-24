import { sanitizeFilename, validateFileSize, validateMimeType } from '@/lib/security/sanitize';
import { generateRoomCode, isValidRoomCode } from '@/lib/security/hash';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { RATE_LIMITS, MAX_FILE_SIZE, ROOM_EXPIRY_HOURS, ROOM_CODE_LENGTH, sanitizeDisplayName, resolveDisplayName } from '@/lib/constants';

describe('Room & Transfer Business Logic', () => {
  test('generates valid room code with 6 digits and no leading zero issues', () => {
    expect(ROOM_CODE_LENGTH).toBe(6);
    for (let i = 0; i < 20; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(isValidRoomCode(code)).toBe(true);
      expect(parseInt(code, 10)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code, 10)).toBeLessThanOrEqual(999999);
    }
  });

  test('validates custom room code format strictly', () => {
    expect(isValidRoomCode('123456')).toBe(true);
    expect(isValidRoomCode('000000')).toBe(true);
    expect(isValidRoomCode('999999')).toBe(true);
    expect(isValidRoomCode('12345')).toBe(false);
    expect(isValidRoomCode('1234567')).toBe(false);
    expect(isValidRoomCode('abcdef')).toBe(false);
    expect(isValidRoomCode('12 345')).toBe(false);
  });

  test('sanitizes and validates display names properly', () => {
    expect(sanitizeDisplayName('Akhil')).toBe('Akhil');
    expect(sanitizeDisplayName('  Akhil Y  ')).toBe('Akhil Y');
    expect(sanitizeDisplayName('Akhil    Yalamanchili')).toBe('Akhil Yalamanchili');
    expect(sanitizeDisplayName('')).toBeNull();
    expect(sanitizeDisplayName('   ')).toBeNull();
    expect(sanitizeDisplayName(null)).toBeNull();
    expect(sanitizeDisplayName(undefined)).toBeNull();

    // Enforce 50 chars limit
    const longName = 'A'.repeat(60);
    expect(sanitizeDisplayName(longName)).toHaveLength(50);
  });

  test('resolves custom name when provided and falls back to random name when empty', () => {
    expect(resolveDisplayName('Akhil')).toBe('Akhil');
    expect(resolveDisplayName('  Jane Doe  ')).toBe('Jane Doe');

    // Fallbacks
    const fallback1 = resolveDisplayName('');
    expect(typeof fallback1).toBe('string');
    expect(fallback1.length).toBeGreaterThan(0);

    const fallback2 = resolveDisplayName('   ');
    expect(typeof fallback2).toBe('string');
    expect(fallback2.length).toBeGreaterThan(0);

    const fallback3 = resolveDisplayName(null);
    expect(typeof fallback3).toBe('string');
    expect(fallback3.length).toBeGreaterThan(0);
  });

  test('validates 24-hour expiration calculation', () => {
    const now = Date.now();
    const expiry = new Date(now + ROOM_EXPIRY_HOURS * 60 * 60 * 1000);
    const diffHours = (expiry.getTime() - now) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24);
  });

  test('enforces rate limits on room creation', () => {
    const ip = '192.168.1.100';
    const limit = RATE_LIMITS.createRoom;

    for (let i = 0; i < limit.maxRequests; i++) {
      const result = checkRateLimit(`create:${ip}`, limit);
      expect(result.allowed).toBe(true);
    }

    const blocked = checkRateLimit(`create:${ip}`, limit);
    expect(blocked.allowed).toBe(false);
  });

  test('enforces rate limits on custom room creation attempts', () => {
    const ip = '192.168.1.105';
    const limit = RATE_LIMITS.createCustomRoom;

    for (let i = 0; i < limit.maxRequests; i++) {
      const result = checkRateLimit(`create_custom_room:${ip}`, limit);
      expect(result.allowed).toBe(true);
    }

    const blocked = checkRateLimit(`create_custom_room:${ip}`, limit);
    expect(blocked.allowed).toBe(false);
  });

  test('enforces rate limits on joining rooms', () => {
    const ip = '192.168.1.101';
    const limit = RATE_LIMITS.joinRoom;

    for (let i = 0; i < limit.maxRequests; i++) {
      const result = checkRateLimit(`join:${ip}`, limit);
      expect(result.allowed).toBe(true);
    }

    const blocked = checkRateLimit(`join:${ip}`, limit);
    expect(blocked.allowed).toBe(false);
  });

  test('prevents path traversal in uploaded files', () => {
    const maliciousNames = [
      '../../../etc/shadow',
      '..\\..\\boot.ini',
      '/var/root/.ssh/id_rsa',
      'foo/bar/baz.txt',
      '../../../../../../../../windows/system32/cmd.exe',
    ];

    maliciousNames.forEach((name) => {
      const clean = sanitizeFilename(name);
      expect(clean).not.toContain('/');
      expect(clean).not.toContain('\\');
      expect(clean).not.toContain('..');
    });
  });

  test('rejects files larger than configured maximum', () => {
    const oversized = MAX_FILE_SIZE + 1024;
    expect(validateFileSize(oversized, MAX_FILE_SIZE)).toBe(false);

    const validSize = 10 * 1024 * 1024; // 10MB
    expect(validateFileSize(validSize, MAX_FILE_SIZE)).toBe(true);
  });

  test('ensures safe mime type fallback', () => {
    expect(validateMimeType('application/pdf')).toBe('application/pdf');
    expect(validateMimeType('image/png')).toBe('image/png');
    expect(validateMimeType('malicious/../../payload')).toBe('application/octet-stream');
  });
});
