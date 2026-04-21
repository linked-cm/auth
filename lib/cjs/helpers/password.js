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
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const AuthCredential_js_1 = require("../shapes/AuthCredential.js");
/**
 * PasswordHelper
 */
const PasswordHelper = {
    /**
     * generate a hashed password
     *
     * @param plainTextPassword
     * @returns
     */
    generateHashedPassword(plainTextPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const saltRounds = 3; // Generate a salt (a random value to add to the password before hashing)
                const hashedPassword = yield bcrypt_1.default.hash(plainTextPassword, saltRounds);
                return hashedPassword;
            }
            catch (error) {
                throw error;
            }
        });
    },
    /**
     * generate a new token
     *
     * @returns
     */
    generateToken() {
        // before use this function to generate a new token, for now we change it to use crypto.randomBytes
        // const newToken = URL.createObjectURL(new Blob([])).slice(-36).replace(/-/g, '');
        return crypto_1.default.randomBytes(20).toString('hex');
    },
    /**
     * Compare the entered password with the hashed password
     *
     * @param enteredPassword
     * @param hashedPassword
     * @returns
     */
    checkPassword(enteredPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const comparedPassword = yield bcrypt_1.default
                .compare(enteredPassword, hashedPassword)
                .catch((err) => {
                console.error('This email and password combination is incorrect');
                return false;
            });
            return comparedPassword;
        });
    },
    /**
     * Validate the reset password token
     *
     * @param token - The reset password token
     * @returns
     */
    validateResetPasswordToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            //check if there is ANY password with this token. If yes, return the userAccount.
            const password = yield AuthCredential_js_1.AuthCredential.select((cred) => cred.credentialOf)
                .where((cred) => {
                return cred.forgotPasswordToken.equals(token);
            })
                .one();
            return password === null || password === void 0 ? void 0 : password.credentialOf;
        });
    },
};
exports.default = PasswordHelper;
//# sourceMappingURL=password.js.map