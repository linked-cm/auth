declare function setAuthTokenStorageMethods(getTokenFn: (key: string) => Promise<string>, setTokenFn: (key: string, value: string, expires?: number) => Promise<void>, removeTokenFn: (key: string) => Promise<void>): void;
declare const ACCESS_TOKEN = "accessToken";
declare const REFRESH_TOKEN = "refreshToken";
declare const ACCESS_TOKEN_EXPIRES: number;
declare const REFRESH_TOKEN_EXPIRES: number;
/**
 * Retrieve a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 * @returns A Promise resolving to the retrieved token or null if not found
 */
declare function getAuthToken(key: string): Promise<string>;
/**
 * Set a token in storage based on the platform (native or web).
 *
 * @param param - An object containing key, value, and optional expiration time
 */
declare function setAuthToken({ key, value, expires, }: {
    key: string;
    value: string;
    expires?: number;
}): Promise<void>;
/**
 * Remove a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 */
declare function removeAuthToken(key: string): Promise<void>;
export { getAuthToken, setAuthToken, removeAuthToken, setAuthTokenStorageMethods, ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES, ACCESS_TOKEN, REFRESH_TOKEN, };
