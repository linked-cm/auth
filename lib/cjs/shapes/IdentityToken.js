"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var IdentityToken_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityToken = void 0;
const Shape_1 = require("@_linked/core/shapes/Shape");
const package_js_1 = require("../package.js");
const auth_js_1 = require("../ontologies/auth.js");
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
const SHACL_1 = require("@_linked/core/shapes/SHACL");
let IdentityToken = IdentityToken_1 = class IdentityToken extends Shape_1.Shape {
    get subject() {
        return '';
    }
    get token() {
        return '';
    }
    get phoneIdentifier() {
        return '';
    }
    get email() {
        return '';
    }
    get account() {
        return undefined;
    }
    /**
     * Searches for an existing token that matches the provided email or subject.
     * @param email The email to match against.
     * @param sub The subject to match against.
     * @returns The matching token, or undefined if no match was found.
     */
    static getTokenByEmailOrSubject(email, sub) {
        return __awaiter(this, void 0, void 0, function* () {
            let existingToken;
            if (email) {
                existingToken = yield IdentityToken_1.select((t) => {
                    return [
                        t.email,
                        t.subject,
                        t.token,
                        t.phoneIdentifier,
                        t.account.select((a) => {
                            return [a.accountOf];
                        }),
                    ];
                })
                    .where((t) => {
                    return t.email.equals(email);
                })
                    .one();
            }
            else if (sub) {
                existingToken = yield IdentityToken_1.select((t) => {
                    return [
                        t.email,
                        t.subject,
                        t.token,
                        t.phoneIdentifier,
                        t.account.select((a) => {
                            return [a.accountOf];
                        }),
                    ];
                })
                    .where((t) => {
                    return t.subject.equals(sub);
                })
                    .one();
            }
            return existingToken;
        });
    }
    static getTokenByAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingToken = yield IdentityToken_1.select((t) => {
                return [
                    t.email,
                    t.subject,
                    t.token,
                    t.phoneIdentifier,
                    t.account.select((a) => {
                        return [a.accountOf];
                    }),
                ];
            })
                .where((t) => {
                return t.account.equals(account);
            })
                .one();
            return existingToken;
        });
    }
    /**
     * checks if the account has an existing token.
     *
     * @param account UserAccount
     * @returns boolean
     */
    static hasToken(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingToken = yield IdentityToken_1.select((t) => {
                return [
                    t.email,
                    t.subject,
                    t.token,
                    t.phoneIdentifier,
                    t.account.select((a) => {
                        return [a.accountOf];
                    }),
                ];
            })
                .where((t) => {
                return t.account.equals(account);
            })
                .one();
            return !!existingToken;
        });
    }
};
exports.IdentityToken = IdentityToken;
IdentityToken.targetClass = auth_js_1.auth.IdentityToken;
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.subject,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "subject", null);
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.token,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "token", null);
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.phoneIdentifier,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "phoneIdentifier", null);
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.email,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "email", null);
__decorate([
    (0, SHACL_1.objectProperty)({
        path: auth_js_1.auth.account,
        maxCount: 1,
        shape: ['lincd-sioc', 'UserAccount'],
        description: 'The account of the identity token.',
    }),
    __metadata("design:type", UserAccount_1.UserAccount),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "account", null);
exports.IdentityToken = IdentityToken = IdentityToken_1 = __decorate([
    package_js_1.linkedShape
], IdentityToken);
//# sourceMappingURL=IdentityToken.js.map