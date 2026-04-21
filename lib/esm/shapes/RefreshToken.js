var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RefreshToken_1;
import { Shape } from '@_linked/core/shapes/Shape';
import { linkedShape } from '../package.js';
import { auth } from '../ontologies/auth.js';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { literalProperty, objectProperty } from '@_linked/core/shapes/SHACL';
let RefreshToken = RefreshToken_1 = class RefreshToken extends Shape {
    get token() {
        return '';
    }
    get account() {
        return undefined;
    }
    /**
     * Remove the token from the database
     *
     * @param token The token to remove
     * @returns True if the token was removed, false if it was not found
     */
    static async removeRefreshToken(token) {
        if (!token) {
            return false;
        }
        const existingToken = await RefreshToken_1.select((t) => [t.token, t.account])
            .where((t) => t.token.equals(token))
            .one();
        if (existingToken) {
            await RefreshToken_1.delete(existingToken);
            return true;
        }
        return false;
    }
    /**
     * Get the refresh token for an account
     *
     * @param account
     * @returns
     */
    static async getRefreshTokenForAccount(account) {
        const existingToken = await RefreshToken_1.select((t) => [t.token, t.account])
            .where((t) => t.account.equals(account))
            .one();
        return existingToken;
    }
};
RefreshToken.targetClass = auth.RefreshToken;
__decorate([
    literalProperty({
        path: auth.token,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], RefreshToken.prototype, "token", null);
__decorate([
    objectProperty({
        path: auth.account,
        shape: ['lincd-sioc', 'UserAccount'],
        maxCount: 1,
    }),
    __metadata("design:type", UserAccount),
    __metadata("design:paramtypes", [])
], RefreshToken.prototype, "account", null);
RefreshToken = RefreshToken_1 = __decorate([
    linkedShape
], RefreshToken);
export { RefreshToken };
//# sourceMappingURL=RefreshToken.js.map