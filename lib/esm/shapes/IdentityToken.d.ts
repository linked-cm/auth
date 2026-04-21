import { Shape } from '@_linked/core/shapes/Shape';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { QResult } from '@_linked/core/queries/SelectQuery';
import { UserAccountData } from '../types/auth.js';
export type IdentityTokenResult = QResult<IdentityToken, {
    subject: string;
    token: string;
    phoneIdentifier: string;
    email: string;
    account: UserAccountData;
}>;
export declare class IdentityToken extends Shape {
    static targetClass: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    get subject(): string;
    get token(): string;
    get phoneIdentifier(): string;
    get email(): string;
    get account(): UserAccount;
    /**
     * Searches for an existing token that matches the provided email or subject.
     * @param email The email to match against.
     * @param sub The subject to match against.
     * @returns The matching token, or undefined if no match was found.
     */
    static getTokenByEmailOrSubject(email: string, sub: string): Promise<IdentityTokenResult>;
    static getTokenByAccount(account: UserAccountData): Promise<IdentityTokenResult>;
    /**
     * checks if the account has an existing token.
     *
     * @param account UserAccount
     * @returns boolean
     */
    static hasToken(account: UserAccountData): Promise<boolean>;
}
