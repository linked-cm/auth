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

// access token expired on 60 minutes
// and refresh token on 60 days / 2 month
let accessToken: number;
let refreshToken: number;

switch (process.env.NODE_ENV) {
  case 'development':
    accessToken = 60 * 60 * 24; // 1 hour
    refreshToken = 60 * 60 * 24 * 30; //  24 hours
    break;
  case 'staging':
    //temporary same as production for testing
    accessToken = 60 * 60 * 24 * 10; // temp solution for production, should be put back to 1 hour
    refreshToken = 60 * 60 * 24 * 60; //  24 hours
    break;
  default: // production
    accessToken = 60 * 60 * 24 * 10; // temp solution for production, should be put back to 1 hour
    refreshToken = 60 * 60 * 24 * 60; // 60 days
    break;
}
const ACCESS_TOKEN_EXPIRES = accessToken;
const REFRESH_TOKEN_EXPIRES = refreshToken;

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
 * @param param - An object containing key, value, and optional expiration time
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
      expires: expires,
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
