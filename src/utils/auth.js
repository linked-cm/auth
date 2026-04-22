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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
var UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
var Person_1 = require("@_linked/schema/shapes/Person");
var Server_1 = require("@_linked/server-utils/utils/Server");
var useAuth_js_1 = require("../hooks/useAuth.js");
var jwt_js_1 = require("./jwt.js");
var QueryContext_1 = require("@_linked/core/queries/QueryContext");
var Auth = /** @class */ (function () {
    function Auth() {
    }
    /**
     * Login method
     *
     * @param request - The incoming request
     * @param findAccount - Function to find an existing account, will log in with this account if it's found
     * @param createAccount - Function to set new data for the user and account
     * @param logMethodName - Name of the log method
     * @returns - Returns the result of the sign-in process
     */
    Auth.login = function (provider, findAccount, createAccount, logMethodName) {
        return __awaiter(this, void 0, void 0, function () {
            var person, account, existing, newAccount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("login method: ".concat(logMethodName));
                        return [4 /*yield*/, findAccount()];
                    case 1:
                        existing = _a.sent();
                        if (!existing) return [3 /*break*/, 2];
                        person = existing.person;
                        account = existing.account;
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, createAccount()];
                    case 3:
                        newAccount = _a.sent();
                        person = newAccount.person;
                        account = newAccount.account;
                        _a.label = 4;
                    case 4: return [2 /*return*/, this.onSigninSuccessful(provider, person, account, !existing)];
                }
            });
        });
    };
    /**
     * Enforces that the user is signed in. If not, it will return a response action to enforce sign in.
     * @returns - Returns a response action to enforce sign in.
     */
    Auth.enforceSignedIn = function () {
        return Server_1.Server.createResponseAction(useAuth_js_1.ENFORCE_SIGNED_IN);
    };
    /**
     * Handle successful sign-in and return authentication result
     * This also ensures that the provided person and account will available on the frontend with useAuth() (from lincd-auth)
     * This method should be used by any other package that implements authentication and wants to persist a successful login
     *
     * @param request - The incoming request
     * @param person - The authenticated person
     * @param account - The user account associated with the person
     * @returns A promise that resolves to an authentication result and tokens
     */
    Auth.onSigninSuccessful = function (provider_1, person_1, account_1) {
        return __awaiter(this, arguments, void 0, function (provider, person, account, isNewAccount) {
            var request, server;
            var _this = this;
            if (isNewAccount === void 0) { isNewAccount = false; }
            return __generator(this, function (_a) {
                console.log('Successful sign-in, sending back to frontend. Person: ' +
                    person.id +
                    ' Account: ' +
                    account.id);
                request = provider.request;
                server = provider.lincdServer;
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var authentication, _a, accessToken, refreshToken, err_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 5, , 6]);
                                    authentication = {
                                        userAccount: account,
                                        user: person,
                                    };
                                    //Give the app its backend provider a chance to extend the authentication data with the default user and account data
                                    //NOTE: this will be things like false/undefined values for extra properties that are not set yet
                                    return [4 /*yield*/, server.callGenericBackendProvidersMethod('initialAuthSession', authentication)];
                                case 1:
                                    //Give the app its backend provider a chance to extend the authentication data with the default user and account data
                                    //NOTE: this will be things like false/undefined values for extra properties that are not set yet
                                    _b.sent();
                                    if (!!isNewAccount) return [3 /*break*/, 3];
                                    return [4 /*yield*/, server.callGenericBackendProvidersMethod('extendAuthSession', authentication)];
                                case 2:
                                    _b.sent();
                                    _b.label = 3;
                                case 3: return [4 /*yield*/, (0, jwt_js_1.createToken)(authentication)];
                                case 4:
                                    _a = _b.sent(), accessToken = _a.accessToken, refreshToken = _a.refreshToken;
                                    //update: we don't need to save the token to the database, it only lives on the front-end
                                    // // save refresh token to database
                                    // if (refreshToken) {
                                    //   const token = await RefreshToken.create({
                                    //     token: refreshToken,
                                    //     account: account,
                                    //   });
                                    //   console.log(`token`, JSON.stringify(token));
                                    // }
                                    // set authentication to the request
                                    Auth.setAuthentication(request, authentication);
                                    resolve({
                                        auth: authentication,
                                        accessToken: accessToken,
                                        refreshToken: refreshToken,
                                        // user: person,
                                        // userAccount: account,
                                    });
                                    return [3 /*break*/, 6];
                                case 5:
                                    err_1 = _b.sent();
                                    console.error('Failed to create token', err_1);
                                    reject(err_1);
                                    return [3 /*break*/, 6];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    Auth.setAuthentication = function (request, authentication) {
        var _this = this;
        var updateSessionData = function (updatedData) { return __awaiter(_this, void 0, void 0, function () {
            var updatedUser, updatedUserAccount, newAuthSession, _a, accessToken, refreshToken;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        updatedUser = __assign(__assign({}, request.linkedAuth.user), updatedData.user);
                        updatedUserAccount = __assign(__assign({}, request.linkedAuth.userAccount), updatedData.userAccount);
                        newAuthSession = {
                            user: updatedUser,
                            userAccount: updatedUserAccount,
                            updateSessionData: updateSessionData,
                        };
                        // Update request.linkedAuth to point to the new session
                        request.linkedAuth = newAuthSession;
                        // Set query context for user and userAccount
                        (0, QueryContext_1.setQueryContext)('user', updatedUser, Person_1.Person);
                        (0, QueryContext_1.setQueryContext)('userAccount', updatedUserAccount, UserAccount_1.UserAccount);
                        return [4 /*yield*/, (0, jwt_js_1.createToken)(request.linkedAuth)];
                    case 1:
                        _a = _b.sent(), accessToken = _a.accessToken, refreshToken = _a.refreshToken;
                        return [2 /*return*/, {
                                auth: {
                                    user: request.linkedAuth.user,
                                    userAccount: request.linkedAuth.userAccount,
                                },
                                accessToken: accessToken,
                                refreshToken: refreshToken,
                            }];
                }
            });
        }); };
        var linkedAuth = __assign(__assign({}, authentication), { updateSessionData: updateSessionData });
        request.linkedAuth = linkedAuth;
        // Set query context for user and userAccount
        (0, QueryContext_1.setQueryContext)('user', linkedAuth.user, Person_1.Person);
        (0, QueryContext_1.setQueryContext)('userAccount', linkedAuth.userAccount, UserAccount_1.UserAccount);
        // console.log(`setAuthentication:`, {
        //   "linkedAuth.user": linkedAuth.user,
        //   "linkedAuth.userAccount": linkedAuth.userAccount,
        // });
        return linkedAuth;
    };
    // define the default user and account types
    Auth.userType = Person_1.Person;
    Auth.accountType = UserAccount_1.UserAccount;
    return Auth;
}());
exports.Auth = Auth;
//# sourceMappingURL=auth.js.map