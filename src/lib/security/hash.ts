import crypto from 'crypto';

/** Hash a room code for secure comparison (not for storage lookup). */
export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Generate a cryptographically secure 8-digit room code (10000000–99999999). */
export function generateRoomCode(): string {
  const min = 10_000_000;
  const max = 99_999_999;
  const range = max - min + 1;
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0);
  return String(min + (num % range));
}

/** Generate a v4 UUID. */
export function generateId(): string {
  return crypto.randomUUID();
}
