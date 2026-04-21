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
exports.REFRESH_TOKEN = exports.ACCESS_TOKEN = exports.REFRESH_TOKEN_EXPIRES = exports.ACCESS_TOKEN_EXPIRES = exports.setAuthTokenStorageMethods = exports.removeAuthToken = exports.setAuthToken = exports.getAuthToken = void 0;
const js_cookie_1 = __importDefault(require("js-cookie"));
let _setTokenFn;
let _getTokenFn;
let _removeTokenFn;
function setAuthTokenStorageMethods(getTokenFn, setTokenFn, removeTokenFn) {
    _getTokenFn = getTokenFn;
    _setTokenFn = setTokenFn;
    _removeTokenFn = removeTokenFn;
}
exports.setAuthTokenStorageMethods = setAuthTokenStorageMethods;
// token keys
const ACCESS_TOKEN = 'accessToken';
exports.ACCESS_TOKEN = ACCESS_TOKEN;
const REFRESH_TOKEN = 'refreshToken';
exports.REFRESH_TOKEN = REFRESH_TOKEN;
// access token expired on 60 minutes
// and refresh token on 60 days / 2 month
let accessToken;
let refreshToken;
switch (process.env.NODE_ENV) {
    case 'development':
        accessToken = 60 * 60 * 24; // 1 hour
        refreshToken = 60 * 60 * 24 * 30; //  24 hours
        break;
    case 'staging':
        //temporary same as production for testing
        accessToken = 60 * 60 * 24 * 10; // temp solution for production, should be put back to 1 hour
        refreshToken = 60 * 60 * 24 * 60; //  24 hours
        break;
    default: // production
        accessToken = 60 * 60 * 24 * 10; // temp solution for production, should be put back to 1 hour
        refreshToken = 60 * 60 * 24 * 60; // 60 days
        break;
}
const ACCESS_TOKEN_EXPIRES = accessToken;
exports.ACCESS_TOKEN_EXPIRES = ACCESS_TOKEN_EXPIRES;
const REFRESH_TOKEN_EXPIRES = refreshToken;
exports.REFRESH_TOKEN_EXPIRES = REFRESH_TOKEN_EXPIRES;
/**
 * Retrieve a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 * @returns A Promise resolving to the retrieved token or null if not found
 */
function getAuthToken(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_getTokenFn) {
            return yield _getTokenFn(key);
        }
        else {
            const token = js_cookie_1.default.get(key);
            return token;
        }
    });
}
exports.getAuthToken = getAuthToken;
/**
 * Set a token in storage based on the platform (native or web).
 *
 * @param param - An object containing key, value, and optional expiration time
 */
function setAuthToken(_a) {
    return __awaiter(this, arguments, void 0, function* ({ key, value, expires, }) {
        if (_setTokenFn) {
            yield _setTokenFn(key, value, expires);
        }
        else {
            js_cookie_1.default.set(key, value, {
                expires: expires,
            });
        }
    });
}
exports.setAuthToken = setAuthToken;
/**
 * Remove a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 */
function removeAuthToken(key) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_removeTokenFn) {
            yield _removeTokenFn(key);
        }
        else {
            js_cookie_1.default.remove(key);
        }
    });
}
exports.removeAuthToken = removeAuthToken;
//# sourceMappingURL=token.js.map