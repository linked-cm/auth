/**
 * Load the data of this ontology into memory, thus adding the properties of the entities of this ontology to the local graph.
 */
export declare var loadData: () => Promise<typeof import("../data/auth.json")>;
/**
 * The namespace of this ontology, which can be used to create NamedNodes with URI's not listed in this file
 */
export declare var ns: (term: string) => import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
/**
 * The NamedNode of the ontology itself
 */
export declare var _self: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var Authentication: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var userAccount: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var IdentityToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var AuthCredential: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var RefreshToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var Password: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var credentialOf: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var token: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var subject: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var email: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var account: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var passwordHash: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var phoneIdentifier: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var forgotPasswordToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var telephone: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare var hash: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
export declare const auth: {
    Authentication: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    userAccount: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    IdentityToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    AuthCredential: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    RefreshToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    Password: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    credentialOf: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    token: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    email: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    phoneIdentifier: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    subject: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    account: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    passwordHash: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    forgotPasswordToken: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    telephone: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
    hash: import("@_linked/core/utils/NodeReference.js").NodeReferenceValue;
};
