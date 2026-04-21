import { Person as FoafPerson } from 'foaf/shapes/Person';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
import { SendMailClient } from 'zeptomail';
import { Request } from 'express-jwt';
import { AuthenticationResult, CreateAccount, OAuthProvider } from './types/auth.js';
import { QResult } from '@_linked/core/queries/SelectQuery';
type Person = FoafPerson | SchemaPerson;
export * from './shapes/AuthCredentialProvider.js';
export default class AuthBackendProvider extends BackendProvider {
    accountShape: typeof UserAccount;
    userShape: typeof SchemaPerson;
    protected zeptoMail: SendMailClient;
    setupBeforeControllers(): Promise<void>;
    validateRequestToken(request: any, accessTokenExpired?: boolean): Promise<string>;
    /**
     * Initialize the incoming request
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     */
    initRequest(request: any, response: any): Promise<void>;
    checkSignin(): any;
    /**
     * Supply data for the incoming request
     * This data will then be available on the frontend right upon initialisation
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     * @param dataQuads - The set of data quads to be populated
     */
    supplyDataForRequest(request: any, response: any, dataQuads: any): Promise<void>;
    /**
     * Sign in with email and password
     *
     * @param email - The email address
     * @param plainPassword - The plain password
     * @returns
     */
    signinWithPassword(email: string, plainPassword: string): Promise<AuthenticationResult>;
    /**
     * Create a new account
     *
     * @param CreateAccount - The account data to create
     * @returns
     */
    createAccount({ firstName, lastName, email, password, }: CreateAccount): Promise<AuthenticationResult>;
    /**
     * Get the password (AuthCredential) for a user
     *
     * @param user - The user
     * @returns The password (AuthCredential)
     */
    getPasswordForUser(user: QResult<Person>): Promise<{
        passwordHash: string;
    } & {
        id: string;
    } & {
        credentialOf: QResult<SchemaPerson, {
            givenName: string;
        } & {
            id: string;
        } & {
            familyName: string;
        } & {
            telephone: string;
        }>;
    }>;
    /**
     * Reset the password
     *
     * @param password - The new password
     * @param confirmPassword - The confirmed password
     * @param token - The reset password token
     * @returns
     */
    resetPassword(password: string, confirmPassword: string, token: string): Promise<AuthenticationResult>;
    getOrCreateAccount(user: QResult<Person>): Promise<QResult<UserAccount, {
        accountOf: {
            id: string;
        };
    }>>;
    /**
     * Send the reset password link with zeptoMail
     *
     * @param email - The email address
     * @returns
     */
    sendResetPasswordLink(email: string): Promise<boolean | {
        error: string;
    }>;
    /**
     * Sign in with OAuth provider
     *
     * @param provider - The OAuth provider
     * @param oauthUserData
     * @returns
     */
    signinOAuth(provider: OAuthProvider, oauthUserData: any): Promise<AuthenticationResult>;
    /**
     * Temporary sign in without any credentials
     * TODO: how to make this support with WebID? since user doesn't have email
     *
     * Note: we not save AuthCredential for temporary user for now, you need to save it on different way. Example: on register form, etc..
     *
     * @returns
     */
    signinTemporary(): Promise<AuthenticationResult>;
    removeAccount(): Promise<boolean>;
    /**
     * Sign out the user and remove the refresh token from the database
     *
     * @returns A promise that resolves to a boolean indicating the success of sign-out
     */
    signout(): Promise<boolean>;
    /**
     * Validate the bearer token header and return the authentication result
     *
     * @param refreshToken - Optional refresh token
     * @returns A promise that resolves to an authentication result
     */
    validateToken(refreshToken?: string): Promise<AuthenticationResult>;
    /**
     * Gets the access token from the request.
     * This method checks the Authorization header for a Bearer token
     * or looks for a cookie named 'accessToken'.
     * @param req
     * @protected
     */
    protected getTokenFromRequest(req: Request): any;
    protected getRefreshTokenFromRequest(req: Request): any;
}
