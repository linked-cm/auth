var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IdentityToken_1;
import { Shape } from '@_linked/core/shapes/Shape';
import { linkedShape } from '../package.js';
import { auth } from '../ontologies/auth.js';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { literalProperty, objectProperty } from '@_linked/core/shapes/SHACL';
let IdentityToken = IdentityToken_1 = class IdentityToken extends Shape {
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
    static async getTokenByEmailOrSubject(email, sub) {
        let existingToken;
        if (email) {
            existingToken = await IdentityToken_1.select((t) => {
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
            existingToken = await IdentityToken_1.select((t) => {
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
    }
    static async getTokenByAccount(account) {
        const existingToken = await IdentityToken_1.select((t) => {
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
    }
    /**
     * checks if the account has an existing token.
     *
     * @param account UserAccount
     * @returns boolean
     */
    static async hasToken(account) {
        const existingToken = await IdentityToken_1.select((t) => {
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
    }
};
IdentityToken.targetClass = auth.IdentityToken;
__decorate([
    literalProperty({
        path: auth.subject,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "subject", null);
__decorate([
    literalProperty({
        path: auth.token,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "token", null);
__decorate([
    literalProperty({
        path: auth.phoneIdentifier,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "phoneIdentifier", null);
__decorate([
    literalProperty({
        path: auth.email,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "email", null);
__decorate([
    objectProperty({
        path: auth.account,
        maxCount: 1,
        shape: ['lincd-sioc', 'UserAccount'],
        description: 'The account of the identity token.',
    }),
    __metadata("design:type", UserAccount),
    __metadata("design:paramtypes", [])
], IdentityToken.prototype, "account", null);
IdentityToken = IdentityToken_1 = __decorate([
    linkedShape
], IdentityToken);
export { IdentityToken };
//# sourceMappingURL=IdentityToken.js.map