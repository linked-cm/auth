"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCredentialProvider = void 0;
const ShapeProvider_1 = require("@_linked/server-utils/utils/ShapeProvider");
const AuthCredential_js_1 = require("./AuthCredential.js");
const password_js_1 = __importDefault(require("../helpers/password.js"));
class AuthCredentialProvider extends ShapeProvider_1.ShapeProvider {
    constructor() {
        super(...arguments);
        this.shape = AuthCredential_js_1.AuthCredential;
    }
    /**
     * Returns true if the user has a password stored in the database
     * That means, they are able to login with email and password
     */
    userHasAuthCredential() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const user = (_b = (_a = this.request) === null || _a === void 0 ? void 0 : _a.linkedAuth) === null || _b === void 0 ? void 0 : _b.user;
            if (!user) {
                console.warn('No user authenticated');
                return false;
            }
            return this.hasAuthCredential(user);
        });
    }
    hasAuthCredential(person) {
        return __awaiter(this, void 0, void 0, function* () {
            const credential = yield AuthCredential_js_1.AuthCredential.select()
                .where((p) => p.credentialOf.equals(person))
                .one();
            return credential && true;
        });
    }
    /**
     * Create a new password for the user
     *
     * @param password
     * @param user
     * @returns
     */
    createNewCredential(email, password, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!password || !(typeof password === 'string')) {
                throw new Error('Password must be a string');
            }
            const passwordHash = yield password_js_1.default.generateHashedPassword(password);
            const credential = yield AuthCredential_js_1.AuthCredential.create({
                credentialOf: user,
                email: email,
                passwordHash: passwordHash,
            });
            return credential;
        });
    }
}
exports.AuthCredentialProvider = AuthCredentialProvider;
//# sourceMappingURL=AuthCredentialProvider.js.map