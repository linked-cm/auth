import crypto from 'node:crypto';
import { UsedOAuthNonce } from '../shapes/UsedOAuthNonce.js';
import { getJwtSecret } from './secrets.js';
import { readTtlFromEnv } from './token.js';

/**
 * Sign-in nonces, issued by the server and usable once.
 *
 * A nonce binds a provider identity token to one sign-in. The client asks the server for a
 * nonce (`createOAuthNonce`), hands it to the provider (Sign in with Apple puts it, or its
 * SHA-256, in the token's `nonce` claim) and sends the raw nonce back with the token. The server
 * then checks that it issued the nonce, that it has not expired, that the token carries it, and
 * that it was never used before. A stolen identity token is useless without its nonce, and a
 * token can never sign in twice.
 *
 * Issuing stores nothing: the nonce is random bytes plus its expiry, signed with an HMAC keyed
 * from JWT_SECRET. Only a redeemed nonce is recorded (`UsedOAuthNonce`), and only after the
 * provider token was verified, so an unauthenticated caller cannot fill the store.
 */

/** How long an issued nonce can be redeemed, in seconds, unless `AUTH_OAUTH_NONCE_TTL` is set. */
export const DEFAULT_OAUTH_NONCE_TTL = 10 * 60;

const NONCE_HMAC_CONTEXT = '@_linked/auth oauth nonce v1\u0000';

function nonceTtlSeconds(): number {
  return readTtlFromEnv('AUTH_OAUTH_NONCE_TTL', DEFAULT_OAUTH_NONCE_TTL);
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', getJwtSecret())
    .update(NONCE_HMAC_CONTEXT + payload)
    .digest('base64url');
}

function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** SHA-256 of a raw nonce, hex: what native Sign in with Apple puts in the `nonce` claim. */
export function hashNonce(nonce: string): string {
  return crypto.createHash('sha256').update(nonce, 'utf8').digest('hex');
}

/** Issue a nonce: `<random>.<expiry in unix seconds>.<hmac>`. */
export function issueOAuthNonce(now: Date = new Date()): { nonce: string; expiresAt: Date } {
  const expiresAt = new Date(now.getTime() + nonceTtlSeconds() * 1000);
  const payload = `${crypto.randomBytes(24).toString('base64url')}.${Math.floor(
    expiresAt.getTime() / 1000
  )}`;
  return { nonce: `${payload}.${sign(payload)}`, expiresAt };
}

/**
 * The expiry of a nonce this server issued, or null when it is not one (wrong format, a
 * signature that does not match) or it has expired.
 */
export function readIssuedNonce(
  nonce: unknown,
  now: Date = new Date()
): { expiresAt: Date } | null {
  if (typeof nonce !== 'string' || nonce.length > 200) return null;
  const parts = nonce.split('.');
  if (parts.length !== 3) return null;
  const [random, expiry, signature] = parts;
  if (!random || !/^\d+$/.test(expiry)) return null;
  if (!timingSafeEqualString(signature, sign(`${random}.${expiry}`))) return null;
  const expiresAt = new Date(Number(expiry) * 1000);
  if (expiresAt.getTime() <= now.getTime()) return null;
  return { expiresAt };
}

/**
 * Whether a token's `nonce` claim carries the nonce the client sent back: either its SHA-256
 * (hex), as native Sign in with Apple does, or the nonce itself (Sign in with Apple JS).
 */
export function nonceClaimMatches(claim: unknown, nonce: string): boolean {
  if (typeof claim !== 'string' || !claim || !nonce) return false;
  return timingSafeEqualString(claim, hashNonce(nonce)) || timingSafeEqualString(claim, nonce);
}

/**
 * Whether Apple sign-in must present a server-issued nonce (`AUTH_APPLE_NONCE`):
 * - `optional` (default): a sign-in that presents a nonce gets the full check; one without a
 *   nonce is still accepted, so clients that do not send one yet keep working.
 * - `required`: every Apple sign-in must present a valid, unused nonce this server issued.
 * Any other value is treated as `required`, so a typo fails closed.
 */
export function appleNonceMode(): 'optional' | 'required' {
  const value = (process.env.AUTH_APPLE_NONCE ?? 'optional').trim().toLowerCase();
  if (value === 'optional' || value === '') return 'optional';
  if (value !== 'required') {
    console.error(
      `@_linked/auth: AUTH_APPLE_NONCE=${JSON.stringify(process.env.AUTH_APPLE_NONCE)} is not ` +
        "'optional' or 'required'; treating it as 'required'"
    );
  }
  return 'required';
}

/** Where redeemed nonces are recorded. Grouped in an object so tests can stub it. */
export const UsedNonceStore = {
  /**
   * Record a nonce as used. Returns false when it was used before. Records of nonces that have
   * expired are deleted along the way.
   */
  async markUsed(nonceHash: string, expiresAt: Date): Promise<boolean> {
    const existing = await UsedOAuthNonce.select((n) => [n.nonceHash])
      .where((n) => n.nonceHash.equals(nonceHash))
      .one();
    if (existing) return false;
    await UsedOAuthNonce.create({ nonceHash, expiresAt });
    // Date comparison is not available in where clauses, so expired records are found here.
    try {
      const records = await UsedOAuthNonce.select((n) => [n.expiresAt]);
      const now = Date.now();
      const expired = (records || [])
        .filter((r) => r.expiresAt && new Date(r.expiresAt as any).getTime() < now)
        .map((r) => ({ id: r.id }));
      if (expired.length) await UsedOAuthNonce.delete(expired);
    } catch (err) {
      console.warn('@_linked/auth: could not delete expired nonce records', (err as any)?.message ?? err);
    }
    return true;
  },
};

/**
 * Check the nonce of a verified Apple identity token.
 *
 * @param claim the token's `nonce` claim (undefined when it has none)
 * @param supplied the nonce the client sent back with the token
 * @returns null when the sign-in may continue, otherwise the reason it may not
 */
export async function checkAppleNonce(claim: unknown, supplied: unknown): Promise<string | null> {
  if (supplied === undefined || supplied === null || supplied === '') {
    if (appleNonceMode() === 'required') return 'Apple sign-in requires a nonce';
    return null;
  }
  if (typeof supplied !== 'string') return 'Invalid Apple sign-in nonce';
  const issued = readIssuedNonce(supplied);
  if (!issued) return 'Invalid or expired Apple sign-in nonce';
  if (!nonceClaimMatches(claim, supplied)) return 'The Apple identity token does not carry this nonce';
  if (!(await UsedNonceStore.markUsed(hashNonce(supplied), issued.expiresAt))) {
    return 'This Apple sign-in nonce was already used';
  }
  return null;
}
