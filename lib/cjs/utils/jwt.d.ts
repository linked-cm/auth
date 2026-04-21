import { AuthSession, AuthSessionPayload } from '../types/auth.js';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
/**
 * Creates an access token for a given authentication session.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns The generated access token as a string.
 */
declare function createAccessToken(payload: AuthSession, audience?: string): Promise<string>;
/**
 * Creates an access token and a refresh token for a given person and user account.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns An object containing the generated access and refresh tokens.
 */
declare function createToken(payload: AuthSession, audience?: string): Promise<{
    accessToken: string;
    refreshToken: string;
}>;
/**
 * Verify the token and returns the payload if valid.
 *
 * Error handle documentation:
 * https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#errors--codes
 *
 * @param token - The token to be verified.
 * @param refreshToken - Optional refresh token to generate a new access token.
 * @returns An object with the payload, access token, and refresh token if valid; otherwise, false.
 */
declare function verifyToken({ request, token, refreshToken, provider, accessTokenExpired, }: {
    request: any;
    token: string;
    refreshToken?: string;
    provider: BackendProvider;
    accessTokenExpired?: boolean;
}): Promise<{
    payload: AuthSessionPayload;
    accessToken?: string;
    refreshToken?: string;
} | false>;
export { createAccessToken, createToken, verifyToken };
