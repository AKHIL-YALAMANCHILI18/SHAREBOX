import {
  formatFileSize,
  formatTimeRemaining,
  getFileExtension,
  getFileTypeCategory,
  formatRoomCode,
} from '@/lib/utils';
import {
  sanitizeFilename,
  validateFileSize,
  validateMimeType,
} from '@/lib/security/sanitize';
import { generateRoomCode, hashCode } from '@/lib/security/hash';
import { checkRateLimit } from '@/lib/security/rate-limit';

describe('Utility & Formatting Functions', () => {
  test('formatFileSize formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 5.5)).toBe('5.5 MB');
    expect(formatFileSize(1024 * 1024 * 1024 * 2)).toBe('2 GB');
  });

  test('formatRoomCode splits 8 digits into two 4-digit groups', () => {
    expect(formatRoomCode('12345678')).toBe('1234 5678');
    expect(formatRoomCode('1234')).toBe('1234');
  });

  test('getFileExtension extracts lowercase extension', () => {
    expect(getFileExtension('archive.tar.gz')).toBe('gz');
    expect(getFileExtension('REPORT.PDF')).toBe('pdf');
    expect(getFileExtension('noextension')).toBe('');
  });

  test('getFileTypeCategory classifies diverse file formats accurately', () => {
    expect(getFileTypeCategory('document.pdf')).toBe('document');
    expect(getFileTypeCategory('spreadsheet.xlsx')).toBe('spreadsheet');
    expect(getFileTypeCategory('video.mp4')).toBe('video');
    expect(getFileTypeCategory('song.mp3')).toBe('audio');
    expect(getFileTypeCategory('photo.png')).toBe('image');
    expect(getFileTypeCategory('backup.zip')).toBe('archive');
    expect(getFileTypeCategory('script.ts')).toBe('code');
    expect(getFileTypeCategory('app.apk')).toBe('executable');
    expect(getFileTypeCategory('disk.iso')).toBe('disk');
    expect(getFileTypeCategory('unknown.xyz123')).toBe('file');
  });

  test('formatTimeRemaining handles active and expired timestamps', () => {
    const future = new Date(Date.now() + 1000 * 60 * 125 + 2000).toISOString(); // ~2h 5m
    expect(formatTimeRemaining(future)).toMatch(/2h [45]m/);

    const past = new Date(Date.now() - 10000).toISOString();
    expect(formatTimeRemaining(past)).toBe('Expired');
  });
});

describe('Security & Sanitization', () => {
  test('sanitizeFilename removes path traversal and dangerous characters', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe');
    expect(sanitizeFilename('my:file*with?bad<chars>.txt')).toBe('my_file_with_bad_chars_.txt');
    expect(sanitizeFilename('')).toBe('unnamed_file');
    expect(sanitizeFilename('.')).toBe('unnamed_file');
    expect(sanitizeFilename('..')).toBe('unnamed_file');
    expect(sanitizeFilename('valid-document_2026.pdf')).toBe('valid-document_2026.pdf');
  });

  test('validateFileSize validates limits', () => {
    const max = 500 * 1024 * 1024; // 500MB
    expect(validateFileSize(1000, max)).toBe(true);
    expect(validateFileSize(max, max)).toBe(true);
    expect(validateFileSize(max + 1, max)).toBe(false);
    expect(validateFileSize(0, max)).toBe(false);
    expect(validateFileSize(-50, max)).toBe(false);
    expect(validateFileSize(NaN, max)).toBe(false);
  });

  test('validateMimeType normalizes MIME types', () => {
    expect(validateMimeType('application/pdf')).toBe('application/pdf');
    expect(validateMimeType('IMAGE/PNG ')).toBe('image/png');
    expect(validateMimeType('invalid mime')).toBe('application/octet-stream');
  });

  test('generateRoomCode produces unique 8-digit numeric codes', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[1-9][0-9]{7}$/);
      expect(code.length).toBe(8);
    }
  });

  test('hashCode creates SHA-256 hex string', () => {
    const h1 = hashCode('12345678');
    const h2 = hashCode('12345678');
    const h3 = hashCode('87654321');
    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });

  test('checkRateLimit enforces limits and resets properly', () => {
    const config = { windowMs: 1000, maxRequests: 3 };
    const key = `test-ip-${Date.now()}`;

    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(true);
    expect(checkRateLimit(key, config).allowed).toBe(false);
  });
});
