import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { Person as FoafPerson } from 'foaf/shapes/Person';
import { AuthenticationResult, AuthSession, EnforceSignedIn, UserAccountData, UserData } from '../types/auth.js';
import { QResult } from '@_linked/core/queries/SelectQuery';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider.js';
export declare class Auth {
    static userType: typeof SchemaPerson | typeof FoafPerson;
    static accountType: typeof UserAccount;
    /**
     * Login method
     *
     * @param request - The incoming request
     * @param findAccount - Function to find an existing account, will log in with this account if it's found
     * @param createAccount - Function to set new data for the user and account
     * @param logMethodName - Name of the log method
     * @returns - Returns the result of the sign-in process
     */
    static login(provider: any, findAccount: () => Promise<{
        account: QResult<UserAccount>;
        person: QResult<SchemaPerson | FoafPerson>;
    }>, createAccount: () => Promise<{
        account: QResult<UserAccount>;
        person: QResult<SchemaPerson | FoafPerson>;
    }>, logMethodName: string): Promise<AuthenticationResult>;
    /**
     * Enforces that the user is signed in. If not, it will return a response action to enforce sign in.
     * @returns - Returns a response action to enforce sign in.
     */
    static enforceSignedIn(): EnforceSignedIn;
    /**
     * Handle successful sign-in and return authentication result
     * This also ensures that the provided person and account will available on the frontend with useAuth() (from lincd-auth)
     * This method should be used by any other package that implements authentication and wants to persist a successful login
     *
     * @param request - The incoming request
     * @param person - The authenticated person
     * @param account - The user account associated with the person
     * @returns A promise that resolves to an authentication result and tokens
     */
    static onSigninSuccessful(provider: BackendProvider, person: UserData, account: UserAccountData, isNewAccount?: boolean): Promise<AuthenticationResult>;
    static setAuthentication(request: Request & {
        linkedAuth: AuthSession;
    }, authentication: AuthSession): AuthSession;
}
