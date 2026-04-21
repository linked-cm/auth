import { Shape } from '@_linked/core/shapes/Shape';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
export declare class Password extends Shape {
    static targetClass: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    get account(): UserAccount;
    get hash(): string;
}
