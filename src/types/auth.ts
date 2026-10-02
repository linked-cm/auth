import { JwtPayload } from 'jsonwebtoken';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { UserAccount } from '@_linked/sioc/shapes/UserAccount';
import { QResult } from '@_linked/core/queries/SelectQuery';
import type { RefreshTokenExpiry } from '../utils/token.js';

/**
 * The payload of the auth token use on backend.
 */
export interface AuthSessionPayload extends JwtPayload, AuthSession {}

/**
 * The result of a successful authentication use on backend.
 */
export type AuthenticationResult =
  | ({
      auth: AuthSession;
      accessToken: string;
      refreshToken: string;
    } & RefreshTokenExpiry)
  | {
      error: string;
      action?: string;
    };

/**
 * signin with OAuth provider
 */
export type OAuthProvider = 'facebook' | 'google' | 'apple';

/**
 * Create a new account signin with email and password.
 */
export type CreateAccount = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/**
 * The result of a successful authentication use on auth hook or frontend.
 */
export type AuthenticationResponse = {
  auth: AuthSession;
  accessToken: string;
  refreshToken: string;
} & RefreshTokenExpiry;

export type UserData = QResult<
  SchemaPerson,
  {
    // givenName: string;
    // familyName?: string;
    // telephone?: string;
  }
>;

export type UserAccountData<User extends UserData = UserData> = QResult<
  UserAccount,
  {
    // email: string;
    accountOf: User;
  }
>;

export type AuthSession<UserAccount = UserAccountData, User = UserData> = {
  userAccount: UserAccount;
  user: User;
  /**
   * The session (refresh token family) the current access token belongs to. Set on the server
   * from the access token's `sid` claim; absent for tokens issued before sessions were stored.
   */
  sid?: string;
  updateSessionData?: (
    updatedData: Omit<AuthSession, 'updateSessionData'>
  ) => Promise<{
    auth: AuthSession;
    accessToken: string;
    refreshToken: string;
  }>;
};

// EnforceSignedIn is the type of the result of the enforceSignedIn method
// when the user is not signed in
export type EnforceSignedIn = {
  [x: string]: string | any[];
  args: any[];
};
