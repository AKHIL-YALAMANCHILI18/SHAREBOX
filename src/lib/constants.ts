export const ROOM_EXPIRY_HOURS = 24;
export const ROOM_CODE_LENGTH = 6;
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024;
export const MAX_FILES_PER_ROOM = parseInt(process.env.MAX_FILES_PER_ROOM || '50', 10);
export const STORAGE_BUCKET = 'sharebox-files';

export const RATE_LIMITS = {
  createRoom: { windowMs: 60_000, maxRequests: 5 },
  createCustomRoom: { windowMs: 60_000, maxRequests: 5 },
  joinRoom: { windowMs: 60_000, maxRequests: 10 },
  uploadFile: { windowMs: 60_000, maxRequests: 20 },
  downloadFile: { windowMs: 60_000, maxRequests: 30 },
} as const;

const DISPLAY_NAMES = [
  'Falcon', 'Phoenix', 'Raven', 'Eagle', 'Hawk',
  'Wolf', 'Fox', 'Bear', 'Lion', 'Tiger',
  'Dolphin', 'Whale', 'Otter', 'Seal', 'Panda',
  'Oak', 'Pine', 'Birch', 'Cedar', 'Maple',
  'Atlas', 'Nova', 'Orion', 'Luna', 'Comet',
];

export function getRandomDisplayName(): string {
  return DISPLAY_NAMES[Math.floor(Math.random() * DISPLAY_NAMES.length)];
}

/**
 * Sanitizes and validates a user-provided display name.
 * Trims whitespace, removes control characters, and enforces length between 1 and 50 characters.
 * Returns null if the name is empty or only whitespace.
 */
export function sanitizeDisplayName(name?: string | null): string | null {
  if (!name || typeof name !== 'string') return null;
  const cleaned = name.replace(/[\x00-\x1F\x7F]/g, '').trim().replace(/\s+/g, ' ');
  if (cleaned.length === 0) return null;
  return cleaned.slice(0, 50);
}

/**
 * Resolves a display name: returns the sanitized user name if valid,
 * otherwise falls back to a friendly randomly generated name.
 */
export function resolveDisplayName(userProvidedName?: string | null): string {
  const sanitized = sanitizeDisplayName(userProvidedName);
  return sanitized || getRandomDisplayName();
}
