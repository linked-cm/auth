"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccessToken = createAccessToken;
exports.createToken = createToken;
exports.verifyToken = verifyToken;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var RefreshToken_js_1 = require("../shapes/RefreshToken.js");
var token_js_1 = require("./token.js");
var JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';
// remove JWT reserved claims if present
function cleanPayload(payload) {
    var exp = payload.exp, iat = payload.iat, nbf = payload.nbf, rest = __rest(payload, ["exp", "iat", "nbf"]);
    return rest;
}
var cachedTokenVerifications = new Map();
/**
 * Creates an access token for a given authentication session.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns The generated access token as a string.
 */
function createAccessToken(payload_1) {
    return __awaiter(this, arguments, void 0, function (payload, audience) {
        if (audience === void 0) { audience = process.env.SITE_ROOT; }
        return __generator(this, function (_a) {
            return [2 /*return*/, sign(payload, token_js_1.ACCESS_TOKEN_EXPIRES, { audience: audience })];
        });
    });
}
function sign(payload, expiresIn, options) {
    return __awaiter(this, void 0, void 0, function () {
        var cleanedPayload;
        return __generator(this, function (_a) {
            cleanedPayload = cleanPayload(payload);
            return [2 /*return*/, jsonwebtoken_1.default.sign(cleanedPayload, JWT_SECRET, __assign({ expiresIn: expiresIn, subject: payload.user.id, issuer: process.env.SITE_ROOT }, options))];
        });
    });
}
/**
 * Creates an access token and a refresh token for a given person and user account.
 *
 * @param payload - The authentication session payload containing user and account data
 * @returns An object containing the generated access and refresh tokens.
 */
function createToken(payload_1) {
    return __awaiter(this, arguments, void 0, function (payload, audience) {
        var accessToken, refreshToken;
        if (audience === void 0) { audience = process.env.SITE_ROOT; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sign(payload, token_js_1.ACCESS_TOKEN_EXPIRES, {
                        audience: audience,
                    })];
                case 1:
                    accessToken = _a.sent();
                    return [4 /*yield*/, sign(payload, token_js_1.REFRESH_TOKEN_EXPIRES)];
                case 2:
                    refreshToken = _a.sent();
                    return [2 /*return*/, {
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                        }];
            }
        });
    });
}
/**
 * Verify the token and returns the payload if valid.
 *
 * Error handle documentation:
 * https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#errors--codes
 *
 * @param token - The token to be verified.
 * @param refreshToken - Optional refresh token to generate a new access token.
 * @returns An object with the payload, access token, and refresh token if valid; otherwise, false.
 */
function verifyToken(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var server, _c, promise, time, verifyPromise;
        var _this = this;
        var request = _b.request, token = _b.token, refreshToken = _b.refreshToken, provider = _b.provider, _d = _b.accessTokenExpired, accessTokenExpired = _d === void 0 ? false : _d;
        return __generator(this, function (_e) {
            server = provider.lincdServer;
            if (!accessTokenExpired && cachedTokenVerifications.has(token)) {
                _c = cachedTokenVerifications.get(token), promise = _c.promise, time = _c.time;
                if (Date.now() - time > token_js_1.ACCESS_TOKEN_EXPIRES * 1000) {
                    // If the cached token verification is older than the access token expiration time, remove it
                    // console.log('Cached token verification expired, re-verifying');
                    cachedTokenVerifications.delete(token);
                }
                else {
                    // const res = await promise;
                    // console.log(`Returning cached token verification result (${res === false ? 'invalid' : 'valid'})`);
                    return [2 /*return*/, promise];
                }
            }
            verifyPromise = new Promise(function (resolve, reject) {
                jsonwebtoken_1.default.verify(token, JWT_SECRET, function (err, decoded) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, tokens, tokenInstance, person, account, authentication, accessToken, decodedToken;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!err) return [3 /*break*/, 11];
                                _a = err.name;
                                switch (_a) {
                                    case 'TokenExpiredError': return [3 /*break*/, 1];
                                    case 'JsonWebTokenError': return [3 /*break*/, 7];
                                    case 'NotBeforeError': return [3 /*break*/, 8];
                                }
                                return [3 /*break*/, 9];
                            case 1:
                                if (!refreshToken) return [3 /*break*/, 5];
                                // console.log('Access token is expired, checking refresh token');
                                // we need to verify if the refresh token is valid
                                // to handle the case when the refresh token is expired
                                try {
                                    jsonwebtoken_1.default.verify(refreshToken, JWT_SECRET);
                                }
                                catch (refreshErr) {
                                    if (refreshErr.name === 'TokenExpiredError') {
                                        // console.error('Refresh token expired also.. rejecting authentication');
                                        return [2 /*return*/, resolve(false)];
                                    }
                                    // if another type of error with refresh token, also reject
                                    return [2 /*return*/, resolve(false)];
                                }
                                return [4 /*yield*/, RefreshToken_js_1.RefreshToken.select(function (t) {
                                        return t.account.select(function (account) {
                                            return [
                                                account.email,
                                                account.accountOf.select(function (user) {
                                                    return [user.givenName, user.familyName, user.telephone];
                                                }),
                                            ];
                                        });
                                    }).where(function (t) { return t.token.equals(refreshToken); })];
                            case 2:
                                tokens = _b.sent();
                                tokenInstance = tokens.shift();
                                // const tokenInstance = RefreshToken.getLocalInstances().find(
                                //   (item) => item.token === refreshToken,
                                // );
                                if (!tokenInstance) {
                                    // console.error('Refresh token not found');
                                    return [2 /*return*/, resolve(false)];
                                }
                                person = tokenInstance.account.accountOf;
                                account = tokenInstance.account;
                                authentication = {
                                    userAccount: account,
                                    user: person,
                                };
                                //Give the app its backend provider a chance to extend the authentication data
                                return [4 /*yield*/, server.callGenericBackendProvidersMethod('extendAuthSession', authentication)];
                            case 3:
                                //Give the app its backend provider a chance to extend the authentication data
                                _b.sent();
                                return [4 /*yield*/, createAccessToken(authentication)];
                            case 4:
                                accessToken = _b.sent();
                                decodedToken = jsonwebtoken_1.default.verify(accessToken, JWT_SECRET);
                                //for initial page requests, we use this to make sure the frontend will also update its tokens
                                // {
                                //   accessToken: accessToken,
                                //     refreshToken: refreshToken,
                                // });
                                //fot initial page request, we make sure the frontend knows that the token was considered valid on the backend
                                // i.e. the user is logged in
                                if (request.frontendData == null) {
                                    request.frontendData = {};
                                }
                                request.frontendData.auth = decodedToken;
                                resolve({
                                    payload: decodedToken,
                                    accessToken: accessToken,
                                    refreshToken: refreshToken,
                                });
                                return [3 /*break*/, 6];
                            case 5: 
                            // console.error('Token expired and no refresh token provided');
                            return [2 /*return*/, resolve(false)];
                            case 6: return [3 /*break*/, 10];
                            case 7:
                                console.error('JWT validation error:', err.message);
                                return [2 /*return*/, resolve(false)];
                            case 8: 
                            // console.error('Token not yet valid');
                            return [2 /*return*/, resolve(false)];
                            case 9:
                                console.error('Unexpected JWT error:', err.message);
                                return [2 /*return*/, resolve(false)];
                            case 10: return [3 /*break*/, 12];
                            case 11:
                                // console.error('Access token valid. Request authenticated');
                                resolve({
                                    payload: decoded,
                                    accessToken: token,
                                    refreshToken: refreshToken,
                                });
                                _b.label = 12;
                            case 12: return [2 /*return*/];
                        }
                    });
                }); });
            });
            // Cache the verification result to avoid redundant verifications
            cachedTokenVerifications.set(token, {
                promise: verifyPromise,
                time: Date.now(),
            });
            return [2 /*return*/, verifyPromise];
        });
    });
}
//# sourceMappingURL=jwt.js.map