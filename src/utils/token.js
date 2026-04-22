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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN = exports.ACCESS_TOKEN = exports.REFRESH_TOKEN_EXPIRES = exports.ACCESS_TOKEN_EXPIRES = void 0;
exports.getAuthToken = getAuthToken;
exports.setAuthToken = setAuthToken;
exports.removeAuthToken = removeAuthToken;
exports.setAuthTokenStorageMethods = setAuthTokenStorageMethods;
var js_cookie_1 = __importDefault(require("js-cookie"));
var _setTokenFn;
var _getTokenFn;
var _removeTokenFn;
function setAuthTokenStorageMethods(getTokenFn, setTokenFn, removeTokenFn) {
    _getTokenFn = getTokenFn;
    _setTokenFn = setTokenFn;
    _removeTokenFn = removeTokenFn;
}
// token keys
var ACCESS_TOKEN = 'accessToken';
exports.ACCESS_TOKEN = ACCESS_TOKEN;
var REFRESH_TOKEN = 'refreshToken';
exports.REFRESH_TOKEN = REFRESH_TOKEN;
// access token expired on 60 minutes
// and refresh token on 60 days / 2 month
var accessToken;
var refreshToken;
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
var ACCESS_TOKEN_EXPIRES = accessToken;
exports.ACCESS_TOKEN_EXPIRES = ACCESS_TOKEN_EXPIRES;
var REFRESH_TOKEN_EXPIRES = refreshToken;
exports.REFRESH_TOKEN_EXPIRES = REFRESH_TOKEN_EXPIRES;
/**
 * Retrieve a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 * @returns A Promise resolving to the retrieved token or null if not found
 */
function getAuthToken(key) {
    return __awaiter(this, void 0, void 0, function () {
        var token;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!_getTokenFn) return [3 /*break*/, 2];
                    return [4 /*yield*/, _getTokenFn(key)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    token = js_cookie_1.default.get(key);
                    return [2 /*return*/, token];
            }
        });
    });
}
/**
 * Set a token in storage based on the platform (native or web).
 *
 * @param param - An object containing key, value, and optional expiration time
 */
function setAuthToken(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var key = _b.key, value = _b.value, expires = _b.expires;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!_setTokenFn) return [3 /*break*/, 2];
                    return [4 /*yield*/, _setTokenFn(key, value, expires)];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    js_cookie_1.default.set(key, value, {
                        expires: expires,
                    });
                    _c.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Remove a token from storage based on the platform (native or web).
 *
 * @param key - The key under which the token is stored
 */
function removeAuthToken(key) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!_removeTokenFn) return [3 /*break*/, 2];
                    return [4 /*yield*/, _removeTokenFn(key)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    js_cookie_1.default.remove(key);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=token.js.map