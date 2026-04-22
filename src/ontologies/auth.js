"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.hash = exports.telephone = exports.forgotPasswordToken = exports.phoneIdentifier = exports.passwordHash = exports.account = exports.email = exports.subject = exports.token = exports.credentialOf = exports.Password = exports.RefreshToken = exports.AuthCredential = exports.IdentityToken = exports.userAccount = exports.Authentication = exports._self = exports.ns = exports.loadData = void 0;
var NameSpace_1 = require("@_linked/core/utils/NameSpace");
var package_js_1 = require("../package.js");
//import all the exports of this file as one variable called _this (we need this at the end)
var _this = __importStar(require("./auth.js"));
/**
 * Load the data of this ontology into memory, thus adding the properties of the entities of this ontology to the local graph.
 */
var loadData = function () {
    if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
        // CommonJS code path
        return Promise.resolve().then(function () { return __importStar(require('../data/auth.json')); });
    }
    else {
        // ESM code path
        //@ts-ignore
        return Promise.resolve().then(function () { return __importStar(require('../data/auth.json')); }).then(function (data) { return data.default; });
    }
};
exports.loadData = loadData;
/**
 * The namespace of this ontology, which can be used to create NamedNodes with URI's not listed in this file
 */
exports.ns = (0, NameSpace_1.createNameSpace)('http://lincd.org/ont/auth/');
/**
 * The NamedNode of the ontology itself
 */
exports._self = (0, exports.ns)('');
//A list of all the entities (Classes & Properties) of this ontology, each exported as a NamedNode
exports.Authentication = (0, exports.ns)('Authentication');
exports.userAccount = (0, exports.ns)('userAccount');
exports.IdentityToken = (0, exports.ns)('IdentityToken');
exports.AuthCredential = (0, exports.ns)('AuthCredential');
exports.RefreshToken = (0, exports.ns)('RefreshToken');
exports.Password = (0, exports.ns)('Password');
exports.credentialOf = (0, exports.ns)('credentialOf');
exports.token = (0, exports.ns)('token');
exports.subject = (0, exports.ns)('subject');
exports.email = (0, exports.ns)('email');
exports.account = (0, exports.ns)('account');
exports.passwordHash = (0, exports.ns)('passwordHash');
exports.phoneIdentifier = (0, exports.ns)('phoneIdentifier');
exports.forgotPasswordToken = (0, exports.ns)('forgotPasswordToken');
exports.telephone = (0, exports.ns)('telephone');
exports.hash = (0, exports.ns)('hash');
//An extra grouping object so all the entities can be accessed from the prefix/name
exports.auth = {
    Authentication: exports.Authentication,
    userAccount: exports.userAccount,
    IdentityToken: exports.IdentityToken,
    AuthCredential: exports.AuthCredential,
    RefreshToken: exports.RefreshToken,
    Password: exports.Password,
    credentialOf: exports.credentialOf,
    token: exports.token,
    email: exports.email,
    phoneIdentifier: exports.phoneIdentifier,
    subject: exports.subject,
    account: exports.account,
    passwordHash: exports.passwordHash,
    forgotPasswordToken: exports.forgotPasswordToken,
    telephone: exports.telephone,
    hash: exports.hash,
};
//Registers this ontology to LINCD.JS, so that data loading can be automated amongst other things
(0, package_js_1.linkedOntology)(_this, exports.ns, 'auth', exports.loadData, '../data/auth.json');
//# sourceMappingURL=auth.js.map