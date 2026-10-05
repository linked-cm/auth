import crypto from 'node:crypto';

/** Number of random bytes in a refresh token (256 bits). */
export const REFRESH_TOKEN_BYTES = 32;

/** A new opaque refresh token: 32 random bytes, base64url. */
export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

/**
 * The value a refresh token is stored and looked up by: SHA-256, base64url.
 * A plain (unsalted) hash is enough here — the input is 256 bits of randomness, not a password.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('base64url');
}

/** True for a value that could be a refresh token issued by this package. */
export function looksLikeOpaqueRefreshToken(token: unknown): token is string {
  // 32 bytes base64url = 43 characters, no padding. Legacy refresh tokens were JWTs (contain dots).
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}
