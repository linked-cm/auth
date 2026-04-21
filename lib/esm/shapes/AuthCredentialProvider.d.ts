import { ShapeProvider } from '@_linked/server-utils/utils/ShapeProvider';
import { AuthCredential } from './AuthCredential.js';
import { QResult } from '@_linked/core/queries/SelectQuery';
import { Person } from '@_linked/schema/shapes/Person';
export declare class AuthCredentialProvider extends ShapeProvider {
    shape: typeof AuthCredential;
    /**
     * Returns true if the user has a password stored in the database
     * That means, they are able to login with email and password
     */
    userHasAuthCredential(): Promise<boolean>;
    hasAuthCredential(person: QResult<Person>): Promise<boolean>;
    /**
     * Create a new password for the user
     *
     * @param password
     * @param user
     * @returns
     */
    createNewCredential(email: any, password: string, user: QResult<Person>): Promise<{
        credentialOf: {
            id: string;
        };
        email: {
            [x: string]: any;
        };
        passwordHash: string;
        id: string;
    }>;
}
