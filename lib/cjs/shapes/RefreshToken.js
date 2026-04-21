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
var RefreshToken_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const Shape_1 = require("@_linked/core/shapes/Shape");
const package_js_1 = require("../package.js");
const auth_js_1 = require("../ontologies/auth.js");
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
const SHACL_1 = require("@_linked/core/shapes/SHACL");
let RefreshToken = RefreshToken_1 = class RefreshToken extends Shape_1.Shape {
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
    static removeRefreshToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!token) {
                return false;
            }
            const existingToken = yield RefreshToken_1.select((t) => [t.token, t.account])
                .where((t) => t.token.equals(token))
                .one();
            if (existingToken) {
                yield RefreshToken_1.delete(existingToken);
                return true;
            }
            return false;
        });
    }
    /**
     * Get the refresh token for an account
     *
     * @param account
     * @returns
     */
    static getRefreshTokenForAccount(account) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingToken = yield RefreshToken_1.select((t) => [t.token, t.account])
                .where((t) => t.account.equals(account))
                .one();
            return existingToken;
        });
    }
};
exports.RefreshToken = RefreshToken;
RefreshToken.targetClass = auth_js_1.auth.RefreshToken;
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.token,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], RefreshToken.prototype, "token", null);
__decorate([
    (0, SHACL_1.objectProperty)({
        path: auth_js_1.auth.account,
        shape: ['lincd-sioc', 'UserAccount'],
        maxCount: 1,
    }),
    __metadata("design:type", UserAccount_1.UserAccount),
    __metadata("design:paramtypes", [])
], RefreshToken.prototype, "account", null);
exports.RefreshToken = RefreshToken = RefreshToken_1 = __decorate([
    package_js_1.linkedShape
], RefreshToken);
//# sourceMappingURL=RefreshToken.js.map