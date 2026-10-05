import crypto from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { AuthSession, AuthSessionPayload } from '../types/auth.js';
import { ACCESS_TOKEN_EXPIRES } from './token.js';
import type { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
import { getJwtSecret } from './secrets.js';
import { issueRefreshToken } from './sessions.js';

/** The `typ` claim of an access token. Refresh tokens are opaque and never JWTs. */
export const ACCESS_TOKEN_TYPE = 'access';

const JWT_ALGORITHM = 'HS256';

/**
 * Claims this package sets itself. They are stripped from any payload before signing: a payload
 * that came from a decoded token (request.linkedAuth) still carries them, and `jsonwebtoken`
 * refuses to sign a payload `aud`/`iss`/`sub` together with the matching option.
 */
const CONTROLLED_CLAIMS = [
  'exp',
  'iat',
  'nbf',
  'aud',
  'iss',
  'sub',
  'jti',
  'typ',
  'sid',
] as const;

function cleanPayload(payload: any) {
  const rest = { ...payload };
  for (const claim of CONTROLLED_CLAIMS) {
    delete rest[claim];
  }
  delete rest.updateSessionData;
  return rest;
}

function defaultAudience(): string | undefined {
  return process.env.SITE_ROOT || undefined;
}

/**
 * Creates an access token for a given authentication session.
 *
 * @param payload - The authentication session payload containing user and account data
 * @param audience - Defaults to SITE_ROOT
 * @param sessionId - The session (refresh token family) this access token belongs to
 * @returns The generated access token as a string.
 */
async function createAccessToken(
  payload: AuthSession,
  audience: string = defaultAudience(),
  sessionId?: string
): Promise<string> {
  const claims: Record<string, any> = {
    ...cleanPayload(payload),
    typ: ACCESS_TOKEN_TYPE,
  };
  if (sessionId) {
    claims.sid = sessionId;
  }
  const options: SignOptions = {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_EXPIRES,
    jwtid: crypto.randomUUID(),
  };
  const subject = payload?.user?.id;
  if (subject) options.subject = subject; // use the user ID as the subject
  if (process.env.SITE_ROOT) options.issuer = process.env.SITE_ROOT;
  if (audience) options.audience = audience;
  return jwt.sign(claims, getJwtSecret(), options);
}

/**
 * Creates an access token and a refresh token for a given person and user account.
 *
 * Starts a new session: the refresh token is a random value whose SHA-256 hash is stored (see
 * utils/sessions.ts). The account (`payload.userAccount.id`) is required.
 *
 * @param payload - The authentication session payload containing user and account data
 * @param audience - Defaults to SITE_ROOT
 * @returns The access and refresh tokens, the session id, and when the refresh token expires.
 */
async function createToken(
  payload: AuthSession,
  audience: string = defaultAudience()
): Promise<{
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  refreshTokenExpiresAt: Date;
}> {
  //TODO: add scope/roles to access token to define what sort of actions this token grants access to
  // this likely goes hand in hand with a UX where the user grants access
  const { refreshToken, sessionId, expiresAt } = await issueRefreshToken(
    payload?.userAccount?.id
  );
  const accessToken = await createAccessToken(payload, audience, sessionId);
  return {
    accessToken,
    refreshToken,
    sessionId,
    refreshTokenExpiresAt: expiresAt,
  };
}

/**
 * Do these verified claims belong to an access token for `audience`?
 *
 * - `typ:'access'` with the expected `aud` → yes.
 * - No `typ` (issued before token kinds existed): yes only with the expected `aud`. Old access
 *   tokens carried `aud`, old refresh tokens did not, so this keeps sessions alive without
 *   accepting old refresh tokens as logins.
 * - Anything else → no.
 */
function isAccessTokenClaims(decoded: any, audience: string | undefined): boolean {
  if (!decoded || typeof decoded !== 'object') return false;
  if (decoded.typ === ACCESS_TOKEN_TYPE) {
    // jwt.verify already enforced aud when an audience is configured
    return audience ? true : decoded.aud === undefined;
  }
  if (decoded.typ === undefined) {
    return Boolean(audience) && decoded.aud !== undefined;
  }
  return false;
}

/**
 * Verified access tokens, so a burst of requests carrying the same token does not repeat the
 * HMAC + JSON work (~0.3 ms each). An entry is dropped at the token's own `exp`, and the map is
 * bounded. Only successful verifications are cached.
 */
const VERIFIED_CACHE_MAX = 1000;
const verifiedAccessTokens = new Map<
  string,
  { payload: AuthSessionPayload; expiresAtMs: number }
>();

function readCache(key: string): AuthSessionPayload | undefined {
  const hit = verifiedAccessTokens.get(key);
  if (!hit) return undefined;
  if (Date.now() >= hit.expiresAtMs) {
    verifiedAccessTokens.delete(key);
    return undefined;
  }
  return hit.payload;
}

function writeCache(key: string, payload: AuthSessionPayload) {
  if (typeof payload.exp !== 'number') return; // never cache a token without an expiry
  if (verifiedAccessTokens.size >= VERIFIED_CACHE_MAX) {
    // Map iterates in insertion order: drop the oldest entry
    const oldest = verifiedAccessTokens.keys().next().value;
    if (oldest !== undefined) verifiedAccessTokens.delete(oldest);
  }
  verifiedAccessTokens.set(key, { payload, expiresAtMs: payload.exp * 1000 });
}

/** Forget every cached verification (tests, secret rotation). */
function clearAccessTokenCache() {
  verifiedAccessTokens.clear();
  warnedTokens.clear();
}

/** Three non-empty base64url segments: the shape of a signed JWT. */
function looksLikeJwt(token: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

/**
 * A rejected JWT (bad signature, wrong audience or kind) is worth one line in the log, but a
 * client keeps presenting the same token on every request, so each token is reported once.
 * Bounded; tokens are remembered by hash.
 */
const WARNED_TOKENS_MAX = 1000;
const warnedTokens = new Set<string>();

function warnOncePerToken(token: string, message: string) {
  const key = crypto.createHash('sha256').update(token).digest('base64url');
  if (warnedTokens.has(key)) return;
  if (warnedTokens.size >= WARNED_TOKENS_MAX) {
    const oldest = warnedTokens.values().next().value;
    if (oldest !== undefined) warnedTokens.delete(oldest);
  }
  warnedTokens.add(key);
  console.warn(message);
}

/**
 * Verify an access token issued by this package.
 *
 * Use this — not a bare `jwt.verify` — wherever an app accepts a bearer token or the
 * `accessToken` cookie: it checks the signature, expiry, audience and token kind, so a refresh
 * token or a token for another audience is refused.
 *
 * @param token - the raw JWT
 * @param options.audience - defaults to SITE_ROOT
 * @returns the token's claims (the AuthSession plus JWT claims), or false
 */
function verifyAccessToken(
  token: string,
  options: { audience?: string } = {}
): AuthSessionPayload | false {
  if (!token || typeof token !== 'string') return false;
  const audience = options.audience ?? defaultAudience();
  if (!looksLikeJwt(token)) {
    // Not a JWT at all — typically the opaque refresh token sent where an access token is
    // expected. Routine (and anonymous), so it is not logged.
    return false;
  }
  const cacheKey = `${audience ?? ''}\n${token}`;
  const cached = readCache(cacheKey);
  if (cached) return cached;

  let decoded: any;
  try {
    decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      ...(audience ? { audience } : {}),
    });
  } catch (err) {
    if (err?.name !== 'TokenExpiredError') {
      // expired tokens are routine; anything else is worth a line in the log
      warnOncePerToken(token, `@_linked/auth: rejected access token: ${err?.message ?? err}`);
    }
    return false;
  }
  if (!isAccessTokenClaims(decoded, audience)) {
    warnOncePerToken(token, '@_linked/auth: rejected a token that is not an access token');
    return false;
  }
  writeCache(cacheKey, decoded as AuthSessionPayload);
  return decoded as AuthSessionPayload;
}

/**
 * Verify an access token and return the payload if valid.
 *
 * Refresh is no longer part of this: a refresh token is never accepted here, and an expired
 * access token is not silently renewed (the new token could not reach the client). Clients
 * refresh through the `validateToken` RPC instead.
 *
 * @param token - The access token to be verified.
 * @param refreshToken - Ignored; kept for signature compatibility.
 * @returns An object with the payload and access token if valid; otherwise, false.
 */
async function verifyToken({
  token,
  refreshToken,
}: {
  request?: any;
  token: string;
  refreshToken?: string;
  provider?: BackendProvider;
  accessTokenExpired?: boolean;
}): Promise<
  | { payload: AuthSessionPayload; accessToken?: string; refreshToken?: string }
  | false
> {
  const payload = verifyAccessToken(token);
  if (!payload) {
    return false;
  }
  return {
    payload,
    accessToken: token,
    refreshToken,
  };
}

export {
  createAccessToken,
  createToken,
  verifyToken,
  verifyAccessToken,
  clearAccessTokenCache,
};
