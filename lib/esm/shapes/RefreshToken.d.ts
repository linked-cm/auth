import { Shape } from '@_linked/core/shapes/Shape';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { UserAccountData } from '../types/auth.js';
export declare class RefreshToken extends Shape {
    static targetClass: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    get token(): string;
    get account(): UserAccount;
    /**
     * Remove the token from the database
     *
     * @param token The token to remove
     * @returns True if the token was removed, false if it was not found
     */
    static removeRefreshToken(token: string): Promise<boolean>;
    /**
     * Get the refresh token for an account
     *
     * @param account
     * @returns
     */
    static getRefreshTokenForAccount(account: UserAccountData): Promise<{
        token: string;
    } & {
        id: string;
    } & {
        account: {
            id: string;
        };
    }>;
}
