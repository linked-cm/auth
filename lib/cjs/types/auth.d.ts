import { JwtPayload } from 'jsonwebtoken';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { QResult } from '@_linked/core/queries/SelectQuery';
/**
 * The payload of the auth token use on backend.
 */
export interface AuthSessionPayload extends JwtPayload, AuthSession {
}
/**
 * The result of a successful authentication use on backend.
 */
export type AuthenticationResult = {
    auth: AuthSession;
    accessToken: string;
    refreshToken: string;
} | {
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
};
export type UserData = QResult<SchemaPerson, {}>;
export type UserAccountData<User extends UserData = UserData> = QResult<UserAccount, {
    accountOf: User;
}>;
export type AuthSession<UserAccount = UserAccountData, User = UserData> = {
    userAccount: UserAccount;
    user: User;
    updateSessionData?: (updatedData: Omit<AuthSession, 'updateSessionData'>) => Promise<{
        auth: AuthSession;
        accessToken: string;
        refreshToken: string;
    }>;
};
export type EnforceSignedIn = {
    [x: string]: string | any[];
    args: any[];
};
