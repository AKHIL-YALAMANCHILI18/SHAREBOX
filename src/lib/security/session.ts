import crypto from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_PREFIX = 'sb_session';
const TOKEN_BYTES = 32;

/** Generate a hex-encoded session token (64 chars). */
export function generateSessionToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex');
}

/** SHA-256 hash of a session token for database storage. */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Set an httpOnly session cookie scoped to a room code. */
export async function setSessionCookie(token: string, roomCode: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${SESSION_COOKIE_PREFIX}_${roomCode}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
}

/** Read the session token for a room from the cookie. */
export async function getSessionToken(roomCode: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`${SESSION_COOKIE_PREFIX}_${roomCode}`)?.value ?? null;
}

/** Clear the session cookie for a room. */
export async function clearSessionCookie(roomCode: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${SESSION_COOKIE_PREFIX}_${roomCode}`);
}
