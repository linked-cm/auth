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
  setAuthToken,
  removeAuthToken,
  setAuthTokenStorageMethods,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
};
