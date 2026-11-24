import crypto from 'crypto';

/** Hash a room code for secure comparison (not for storage lookup). */
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Generate a cryptographically secure 6-digit room code (100000–999999). */
export function generateRoomCode(): string {
  const min = 100_000;
  const max = 999_999;
  const range = max - min + 1;
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0);
  return String(min + (num % range));
}

/** Validate whether a room code is a valid 6-digit numeric string. */
export function isValidRoomCode(code: string): boolean {
  return typeof code === 'string' && /^\d{6}$/.test(code.trim());
}

/** Generate a v4 UUID. */
export function generateId(): string {
  return crypto.randomUUID();
}
