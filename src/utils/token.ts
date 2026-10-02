import Cookies from 'js-cookie';

let _setTokenFn: (
  key: string,
  value: string,
  expires?: number
) => Promise<void>;
let _getTokenFn: (key: string) => Promise<string>;
let _removeTokenFn: (key: string) => Promise<void>;

function setAuthTokenStorageMethods(
  getTokenFn: (key: string) => Promise<string>,
  setTokenFn: (key: string, value: string, expires?: number) => Promise<void>,
  removeTokenFn: (key: string) => Promise<void>
) {
  _getTokenFn = getTokenFn;
  _setTokenFn = setTokenFn;
  _removeTokenFn = removeTokenFn;
}

// token keys
const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';

/**
 * Token lifetimes, in SECONDS.
 *
 * Defaults (unchanged from earlier releases):
 * - development: access token 24 hours, refresh token 30 days
 * - every other NODE_ENV (production, staging, unset): access token 10 days, refresh token 60 days
 *
 * Override on the server with `AUTH_ACCESS_TOKEN_TTL` / `AUTH_REFRESH_TOKEN_TTL` (seconds).
 * The refresh lifetime is sliding: every successful refresh issues a new refresh token that is
 * valid for the full lifetime again.
 *
 * In the browser `process.env` is usually not populated, so the client falls back to the
 * defaults. The client only uses these values for cookie lifetimes and its validation interval;
 * the server decides what is valid.
 */
const isDevelopment =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

const DEFAULT_ACCESS_TOKEN_TTL = isDevelopment
  ? 60 * 60 * 24 // 24 hours
  : 60 * 60 * 24 * 10; // 10 days
const DEFAULT_REFRESH_TOKEN_TTL = isDevelopment
  ? 60 * 60 * 24 * 30 // 30 days
  : 60 * 60 * 24 * 60; // 60 days

function readTtlFromEnv(name: string, fallback: number): number {
  let raw: string | undefined;
  try {
    raw = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  } catch {
    raw = undefined;
  }
  if (raw === undefined || raw === null || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `@_linked/auth: ${name} must be a positive whole number of seconds, got "${raw}"`
    );
  }
  return value;
}

/** Access token lifetime in seconds. */
const ACCESS_TOKEN_EXPIRES = readTtlFromEnv(
  'AUTH_ACCESS_TOKEN_TTL',
  DEFAULT_ACCESS_TOKEN_TTL
);
/** Refresh token lifetime in seconds. */
const REFRESH_TOKEN_EXPIRES = readTtlFromEnv(
  'AUTH_REFRESH_TOKEN_TTL',
  DEFAULT_REFRESH_TOKEN_TTL
);

const SECONDS_PER_DAY = 60 * 60 * 24;

/**
 * Retrieve a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 * @returns A Promise resolving to the retrieved token or null if not found
 */
async function getAuthToken(key: string) {
  if (_getTokenFn) {
    return await _getTokenFn(key);
  } else {
    const token = Cookies.get(key);
    return token;
  }
}

/**
 * Set a token in storage based on the platform (native or web).
 *
 * @param param - An object containing key, value, and optional expiration time IN SECONDS
 */
async function setAuthToken({
  key,
  value,
  expires,
}: {
  key: string;
  value: string;
  expires?: number;
}) {
  if (_setTokenFn) {
    await _setTokenFn(key, value, expires);
  } else {
    Cookies.set(key, value, {
      // js-cookie takes a number of DAYS; `expires` is in seconds.
      expires: expires ? expires / SECONDS_PER_DAY : undefined,
    });
  }
}

/**
 * Seconds until a JWT's `exp`, read without verifying it (the server verifies; this only sizes
 * the cookie). Undefined when the token cannot be read or has already expired.
 */
function secondsUntilJwtExpiry(token: string, nowMs: number = Date.now()): number | undefined {
  try {
    const part = token.split('.')[1];
    if (!part) return undefined;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    const exp = JSON.parse(json)?.exp;
    if (typeof exp !== 'number') return undefined;
    const seconds = Math.floor(exp - nowMs / 1000);
    return seconds > 0 ? seconds : undefined;
  } catch {
    return undefined;
  }
}

/**
 * When the refresh token the server just issued (or confirmed) stops being valid.
 *
 * The server's lifetime (`AUTH_REFRESH_TOKEN_TTL`) is not visible in the browser, so it returns
 * the record's expiry with every token response. `refreshTokenExpiresIn` (seconds from the
 * response) is used first because it does not depend on the client's clock.
 */
export interface RefreshTokenExpiry {
  /** Seconds from the response until the refresh token expires. */
  refreshTokenExpiresIn?: number;
  /** The refresh token's expiry as an ISO date-time. */
  refreshTokenExpiresAt?: string;
}

/** The expiry fields a server sends for a refresh token expiring at `expiresAt`. */
function refreshTokenExpiryFields(
  expiresAt: Date | undefined,
  now: Date = new Date()
): RefreshTokenExpiry {
  if (!expiresAt || isNaN(expiresAt.getTime())) return {};
  return {
    refreshTokenExpiresAt: expiresAt.toISOString(),
    refreshTokenExpiresIn: Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    ),
  };
}

/** Seconds the refresh token cookie should live, from the server's expiry fields if present. */
function secondsUntilRefreshExpiry(
  expiry: RefreshTokenExpiry | undefined,
  nowMs: number = Date.now()
): number | undefined {
  const inSeconds = expiry?.refreshTokenExpiresIn;
  if (typeof inSeconds === 'number' && Number.isFinite(inSeconds) && inSeconds > 0) {
    return Math.floor(inSeconds);
  }
  if (expiry?.refreshTokenExpiresAt) {
    const atMs = Date.parse(expiry.refreshTokenExpiresAt);
    if (!isNaN(atMs) && atMs > nowMs) {
      return Math.floor((atMs - nowMs) / 1000);
    }
  }
  return undefined;
}

/**
 * Store the tokens of an authentication response.
 *
 * - The access token cookie lives exactly as long as the token (its JWT `exp`).
 * - The refresh token cookie lives as long as the server's record (`refreshTokenExpiresIn` /
 *   `refreshTokenExpiresAt` in the response). A server that does not send them (releases before
 *   they existed) gets the client defaults — except when the refresh token is the one already
 *   stored, which is then left alone rather than extended past what the server knows about.
 */
async function storeAuthTokens({
  accessToken,
  refreshToken,
  refreshTokenExpiresIn,
  refreshTokenExpiresAt,
}: {
  accessToken?: string;
  refreshToken?: string;
} & RefreshTokenExpiry): Promise<void> {
  if (accessToken) {
    await setAuthToken({
      key: ACCESS_TOKEN,
      value: accessToken,
      expires: secondsUntilJwtExpiry(accessToken) ?? ACCESS_TOKEN_EXPIRES,
    });
  }
  if (refreshToken) {
    const expires = secondsUntilRefreshExpiry({
      refreshTokenExpiresIn,
      refreshTokenExpiresAt,
    });
    if (expires === undefined && (await getAuthToken(REFRESH_TOKEN)) === refreshToken) {
      return;
    }
    await setAuthToken({
      key: REFRESH_TOKEN,
      value: refreshToken,
      expires: expires ?? REFRESH_TOKEN_EXPIRES,
    });
  }
}

/**
 * Remove a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 */
async function removeAuthToken(key: string) {
  if (_removeTokenFn) {
    await _removeTokenFn(key);
  } else {
    Cookies.remove(key);
  }
}

export {
  getAuthToken,
  storeAuthTokens,
  secondsUntilJwtExpiry,
  secondsUntilRefreshExpiry,
  refreshTokenExpiryFields,
  setAuthToken,
  removeAuthToken,
  setAuthTokenStorageMethods,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
};
