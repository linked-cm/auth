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
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppleHelper = {
    /**
     * Fetches the public key from Apple's authentication service.
     * @param kid Key ID of the public key to fetch.
     * @returns The public key associated with the provided Key ID.
     */
    key(kid) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = (0, jwks_rsa_1.default)({
                jwksUri: 'https://appleid.apple.com/auth/keys',
                timeout: 30000,
            });
            return yield client.getSigningKey(kid);
        });
    },
    /**
     * Decodes the provided identity token.
     * @param identityToken The identity token to decode.
     * @returns An object containing the email and subject from the decoded token.
     */
    decodeIdentityToken(identityToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const { header } = jsonwebtoken_1.default.decode(identityToken, { complete: true });
            const kid = header.kid;
            const publicKey = (yield this.key(kid)).getPublicKey();
            const tokenLoad = jsonwebtoken_1.default.verify(identityToken, publicKey);
            const email = tokenLoad['email'];
            const sub = tokenLoad.sub;
            return { email, sub };
        });
    },
};
exports.default = AppleHelper;
//# sourceMappingURL=apple.js.map