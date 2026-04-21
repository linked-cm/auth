import { Shape } from '@_linked/core/shapes/Shape';
import { QResult } from '@_linked/core/queries/SelectQuery';
import { Person } from '@_linked/schema/shapes/Person';
export declare class AuthCredential extends Shape {
    static targetClass: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    get credentialOf(): Person;
    get email(): string;
    get forgotPasswordToken(): string;
    get passwordHash(): string;
    get telephone(): string;
    static userHasAuthCredential(): Promise<boolean>;
    static hasAuthCredential(person: QResult<Person>): Promise<boolean>;
    static createNewCredential(email: string, password: string, user: QResult<Person>): Promise<QResult<AuthCredential>>;
}
