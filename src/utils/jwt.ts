import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthSession, AuthSessionPayload } from '../types/auth.js';
import { RefreshToken } from '../shapes/RefreshToken.js';
import { ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } from './token.js';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
import { setRequestData } from '@_linked/server-utils/utils/RequestData';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';

// remove JWT reserved claims if present
function cleanPayload(payload: any) {
  const { exp, iat, nbf, ...rest } = payload;
  return rest;
}
const cachedTokenVerifications = new Map<
  string,
  {
    promise: Promise<
      | {
          payload: AuthSessionPayload;
          accessToken?: string;
          refreshToken?: string;
        }
      | false
    >;
    time: number;
  }
>();
/**
 * Creates an access token for a given authentication session.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns The generated access token as a string.
 */
async function createAccessToken(
  payload: AuthSession,
  audience: string = process.env.SITE_ROOT
): Promise<string> {
  return sign(payload, ACCESS_TOKEN_EXPIRES, { audience });
}

async function sign(
  payload: AuthSession,
  expiresIn: number,
  options?: SignOptions
): Promise<string> {
  const cleanedPayload = cleanPayload(payload);
  return jwt.sign(cleanedPayload, JWT_SECRET, {
    expiresIn: expiresIn,
    subject: payload.user.id, // use the user ID as the subject
    issuer: process.env.SITE_ROOT,
    ...options,
  });
}
/**
 * Creates an access token and a refresh token for a given person and user account.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns An object containing the generated access and refresh tokens.
 */
async function createToken(
  payload: AuthSession,
  audience: string = process.env.SITE_ROOT
): Promise<{ accessToken: string; refreshToken: string }> {
  // console.log(`create token`, JSON.stringify(payload));
  //TODO: add scope/roles to access token to define what sort of actions this token grants access to
  // this likely goes hand in hand with a UX where the user grants access
  const accessToken = await sign(payload, ACCESS_TOKEN_EXPIRES, {
    audience: audience,
  });
  const refreshToken = await sign(payload, REFRESH_TOKEN_EXPIRES);

  return {
    accessToken,
    refreshToken,
  };
}

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
async function verifyToken({
  request,
  token,
  refreshToken,
  provider,
  accessTokenExpired = false,
}: {
  request;
  token: string;
  refreshToken?: string;
  provider: BackendProvider;
  accessTokenExpired?: boolean;
}): Promise<
  | { payload: AuthSessionPayload; accessToken?: string; refreshToken?: string }
  | false
> {
  const server = provider.lincdServer;

  if (!accessTokenExpired && cachedTokenVerifications.has(token)) {
    // If the token is already verified, return the cached result
    let { promise, time } = cachedTokenVerifications.get(token);
    if (Date.now() - time > ACCESS_TOKEN_EXPIRES * 1000) {
      // If the cached token verification is older than the access token expiration time, remove it
      // console.log('Cached token verification expired, re-verifying');
      cachedTokenVerifications.delete(token);
    } else {
      // const res = await promise;
      // console.log(`Returning cached token verification result (${res === false ? 'invalid' : 'valid'})`);
      return promise;
    }
  }
  // console.log('Verifying token');
  const verifyPromise = new Promise<
    | {
        payload: AuthSessionPayload;
        accessToken?: string;
        refreshToken?: string;
      }
    | false
  >((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        switch (err.name) {
          case 'TokenExpiredError':
            if (refreshToken) {
              // console.log('Access token is expired, checking refresh token');
              // we need to verify if the refresh token is valid
              // to handle the case when the refresh token is expired
              try {
                jwt.verify(refreshToken, JWT_SECRET);
              } catch (refreshErr) {
                if (refreshErr.name === 'TokenExpiredError') {
                  // console.error('Refresh token expired also.. rejecting authentication');
                  return resolve(false);
                }
                // if another type of error with refresh token, also reject
                return resolve(false);
              }

              // check if the refresh token is stored in the database
              const tokens = await RefreshToken.select((t) => {
                return t.account.select((account) => {
                  return [
                    account.email,
                    account.accountOf.select((user) => {
                      return [user.givenName, user.familyName, user.telephone];
                    }),
                  ];
                });
              }).where((t) => t.token.equals(refreshToken));
              const tokenInstance = tokens.shift();
              // const tokenInstance = RefreshToken.getLocalInstances().find(
              //   (item) => item.token === refreshToken,
              // );

              if (!tokenInstance) {
                // console.error('Refresh token not found');
                return resolve(false);
              }

              const person = tokenInstance.account.accountOf;
              const account = tokenInstance.account;

              // create authentication object (should be the same basic data as in Auth util)
              let authentication: AuthSession = {
                userAccount: account,
                user: person,
              };

              //Give the app its backend provider a chance to extend the authentication data
              await server.callGenericBackendProvidersMethod(
                'extendAuthSession',
                authentication
              );

              // when refresh token is valid, generate new access token
              const accessToken = await createAccessToken(authentication);

              // and then verify the new access token
              const decodedToken = jwt.verify(
                accessToken,
                JWT_SECRET
              ) as AuthSessionPayload;

              //for initial page requests, we use this to make sure the frontend will also update its tokens
              // {
              //   accessToken: accessToken,
              //     refreshToken: refreshToken,
              // });

              //fot initial page request, we make sure the frontend knows that the token was considered valid on the backend
              // i.e. the user is logged in
              if (request.frontendData == null) {
                request.frontendData = {};
              }
              request.frontendData.auth = decodedToken;

              resolve({
                payload: decodedToken,
                accessToken: accessToken,
                refreshToken: refreshToken,
              });
            } else {
              // console.error('Token expired and no refresh token provided');
              return resolve(false);
            }
            break;
          case 'JsonWebTokenError':
            console.error('JWT validation error:', err.message);
            return resolve(false);
          case 'NotBeforeError':
            // console.error('Token not yet valid');
            return resolve(false);
          default:
            console.error('Unexpected JWT error:', err.message);
            return resolve(false);
        }
      } else {
        // console.error('Access token valid. Request authenticated');
        resolve({
          payload: decoded as AuthSessionPayload,
          accessToken: token,
          refreshToken,
        });
      }
    });
  });

  // Cache the verification result to avoid redundant verifications
  cachedTokenVerifications.set(token, {
    promise: verifyPromise,
    time: Date.now(),
  });
  return verifyPromise;
}

export { createAccessToken, createToken, verifyToken };
