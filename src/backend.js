"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Person_1 = require("@_linked/schema/shapes/Person");
var UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
var BackendProvider_1 = require("@_linked/server-utils/utils/BackendProvider");
var express_session_1 = __importDefault(require("express-session"));
var auth_js_1 = require("./utils/auth.js");
var zeptomail_1 = require("zeptomail");
var AuthCredential_js_1 = require("./shapes/AuthCredential.js");
var express_jwt_1 = require("express-jwt");
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var jwt_js_1 = require("./utils/jwt.js");
var RefreshToken_js_1 = require("./shapes/RefreshToken.js");
var events_js_1 = require("./utils/events.js");
var apple_js_1 = __importDefault(require("./helpers/apple.js"));
var google_js_1 = __importDefault(require("./helpers/google.js"));
var password_js_1 = __importDefault(require("./helpers/password.js"));
var IdentityToken_js_1 = require("./shapes/IdentityToken.js");
var path_1 = __importStar(require("path"));
var node_crypto_1 = __importDefault(require("node:crypto"));
var LinkedEmail_1 = require("@_linked/server-utils/utils/LinkedEmail");
var connect_sqlite3_1 = __importDefault(require("connect-sqlite3"));
var webID_js_1 = require("./utils/webID.js");
var SQLiteStore = (0, connect_sqlite3_1.default)(express_session_1.default);
__exportStar(require("./shapes/AuthCredentialProvider.js"), exports);
var filename__ = typeof __filename !== 'undefined'
    ? __filename
    : //@ts-ignore
        (0, path_1.basename)(import.meta.url).replace('file:/', '');
var AuthBackendProvider = /** @class */ (function (_super) {
    __extends(AuthBackendProvider, _super);
    function AuthBackendProvider() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.accountShape = UserAccount_1.UserAccount;
        _this.userShape = Person_1.Person;
        return _this;
    }
    AuthBackendProvider.prototype.setupBeforeControllers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var secret;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    //if defined, take the values from the environment variables to define the shapes for the account and user
                    return [4 /*yield*/, this.assignEnvPathToField('AUTH_ACCOUNT_TYPE', 'accountShape')];
                    case 1:
                        //if defined, take the values from the environment variables to define the shapes for the account and user
                        _a.sent();
                        return [4 /*yield*/, this.assignEnvPathToField('AUTH_USER_TYPE', 'userShape')];
                    case 2:
                        _a.sent();
                        (0, events_js_1.onAccountWillBeRemoved)(function (account) { return __awaiter(_this, void 0, void 0, function () {
                            var refreshTokens, refreshTokens_1, refreshTokens_1_1, refreshToken, e_1_1;
                            var e_1, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, RefreshToken_js_1.RefreshToken.select(function (rt) { return [
                                            rt.account,
                                        ]; }).where(function (rt) { return rt.account.equals(account); })];
                                    case 1:
                                        refreshTokens = _b.sent();
                                        if (!(refreshTokens.length > 0)) return [3 /*break*/, 9];
                                        _b.label = 2;
                                    case 2:
                                        _b.trys.push([2, 7, 8, 9]);
                                        refreshTokens_1 = __values(refreshTokens), refreshTokens_1_1 = refreshTokens_1.next();
                                        _b.label = 3;
                                    case 3:
                                        if (!!refreshTokens_1_1.done) return [3 /*break*/, 6];
                                        refreshToken = refreshTokens_1_1.value;
                                        return [4 /*yield*/, RefreshToken_js_1.RefreshToken.delete(refreshToken)];
                                    case 4:
                                        _b.sent();
                                        _b.label = 5;
                                    case 5:
                                        refreshTokens_1_1 = refreshTokens_1.next();
                                        return [3 /*break*/, 3];
                                    case 6: return [3 /*break*/, 9];
                                    case 7:
                                        e_1_1 = _b.sent();
                                        e_1 = { error: e_1_1 };
                                        return [3 /*break*/, 9];
                                    case 8:
                                        try {
                                            if (refreshTokens_1_1 && !refreshTokens_1_1.done && (_a = refreshTokens_1.return)) _a.call(refreshTokens_1);
                                        }
                                        finally { if (e_1) throw e_1.error; }
                                        return [7 /*endfinally*/];
                                    case 9: return [2 /*return*/];
                                }
                            });
                        }); });
                        // set the user and account shapes for auth
                        auth_js_1.Auth.userType = this.userShape;
                        auth_js_1.Auth.accountType = this.accountShape;
                        // set zeptoMail client
                        this.zeptoMail = new zeptomail_1.SendMailClient({
                            url: 'api.zeptomail.com/',
                            token: process.env.ZEPTOMAIL_TOKEN,
                        });
                        // FOR initial page requests we send the JWT token as a cookie (Stored in the browser)
                        // see getToken for how we use the cookie and set this.request.linkedAuth
                        this.server.use((0, cookie_parser_1.default)());
                        // For API requests, we send a token as the Bearer header
                        // It gets parsed by this middleware and the result is that
                        // on getToken we catch first every request and check the headers or cookies
                        // and if has, we set into this.request.linkedAuth
                        this.server.use((0, express_jwt_1.expressjwt)({
                            secret: process.env.JWT_SECRET || 'jwt-secret', // need to set this environment variable
                            algorithms: ['HS256'],
                            credentialsRequired: false, // allows unauthenticated requests to pass through
                            getToken: function (req) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, this.validateRequestToken(req)];
                                });
                            }); },
                            // called only when exp has passed
                            onExpired: function (req, err) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: 
                                        // …issue a new token or just keep going
                                        // req.auth will be undefined, so unauthenticated routes still work
                                        return [4 /*yield*/, this.validateRequestToken(req, true)];
                                        case 1:
                                            // …issue a new token or just keep going
                                            // req.auth will be undefined, so unauthenticated routes still work
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                        }).unless({
                            // Skip token verification for all static assets
                            path: [
                                /^\/public\/.*/, // anything under /public
                                /^\/uploads\/.*/, // anything under /uploads
                                /^\/resized\/.*/, // dynamically‑resized images
                                /^\/favicon\.ico$/, // favicon
                                /^\/\.well-known\/.*/, // ACME challenges etc.
                            ],
                        }));
                        if (process.env.SESSION_SECRET) {
                            secret = process.env.SESSION_SECRET;
                        }
                        else {
                            if (process.env.NODE_ENV !== 'development') {
                                console.warn('Please set the environment variable SESSION_SECRET\n' +
                                    'This is to ensure the sessions of this app are securely stored.\n' +
                                    'Preferably use a string of mixed characters. If this is a LINCD app, you can add the SESSION_SECRET to `.env-cmdrc.json`.\n' +
                                    'For now a less secure fallback method will be used.\n' +
                                    'See also https://www.npmjs.com/package/express-session#secret and https://www.npmjs.com/package/cookie-session#secret\n');
                            }
                            secret = node_crypto_1.default.createHash('md5').update(filename__).digest('hex');
                        }
                        this.server.use((0, express_session_1.default)({
                            secret: secret,
                            name: '@_linked/auth',
                            //TODO: this broke sessions in production, need to check what else we need to do to make secure sessions work
                            // cookie: {secure: process.env.NODE_ENV === 'production'},
                            resave: true,
                            saveUninitialized: false,
                            store: new SQLiteStore({
                                dir: path_1.default.join(process.cwd(), 'data'),
                            }),
                        }));
                        return [2 /*return*/];
                }
            });
        });
    };
    AuthBackendProvider.prototype.validateRequestToken = function (request_1) {
        return __awaiter(this, arguments, void 0, function (request, accessTokenExpired) {
            var token, refreshToken, verificationResult, authentication;
            if (accessTokenExpired === void 0) { accessTokenExpired = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = this.getTokenFromRequest(request);
                        refreshToken = this.getRefreshTokenFromRequest(request);
                        if (!token) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, jwt_js_1.verifyToken)({
                                request: request,
                                token: token,
                                refreshToken: refreshToken,
                                provider: this,
                                accessTokenExpired: accessTokenExpired,
                            })];
                    case 1:
                        verificationResult = _a.sent();
                        if (!verificationResult) return [3 /*break*/, 3];
                        return [4 /*yield*/, auth_js_1.Auth.setAuthentication(request, verificationResult.payload)];
                    case 2:
                        authentication = _a.sent();
                        if (!authentication) {
                            console.log("GET TOKEN authentication: no authentication");
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, verificationResult.accessToken];
                    case 3: return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Initialize the incoming request
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     */
    AuthBackendProvider.prototype.initRequest = function (request, response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                _super.prototype.initRequest.call(this, request, response);
                return [2 /*return*/];
            });
        });
    };
    // TODO: check possible to remove this method?
    AuthBackendProvider.prototype.checkSignin = function () {
        var _a;
        //this is a temporary fix that allows the frontend to check if the user is still logged in on the backend
        return (_a = this.request.linkedAuth) === null || _a === void 0 ? void 0 : _a.userAccount;
    };
    /**
     * Supply data for the incoming request
     * This data will then be available on the frontend right upon initialisation
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     * @param dataQuads - The set of data quads to be populated
     */
    AuthBackendProvider.prototype.supplyDataForRequest = function (request, response, dataQuads) {
        return __awaiter(this, void 0, void 0, function () {
            var requestAuth;
            return __generator(this, function (_a) {
                //if logged in and we're collecting frontend data
                if (request.linkedAuth && request.frontendData) {
                    requestAuth = __assign({}, request.linkedAuth);
                    //Remove things that should not go to the frontend
                    delete requestAuth.updateSessionData;
                    //Store in the object that will be sent to the frontend
                    request.frontendData.auth = requestAuth;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Sign in with email and password
     *
     * @param email - The email address
     * @param plainPassword - The plain password
     * @returns
     */
    AuthBackendProvider.prototype.signinWithPassword = function (email, plainPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var webID, existingCredential, account_1, passwordIsValid, person, account;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            webID = (0, webID_js_1.emailToWebID)(email);
                        }
                        catch (error) {
                            console.error("Invalid email format during signin: ".concat(email), error);
                            return [2 /*return*/, {
                                    error: 'Invalid email format',
                                }];
                        }
                        return [4 /*yield*/, this.getPasswordForUser({ id: webID })];
                    case 1:
                        existingCredential = _a.sent();
                        if (!!existingCredential) return [3 /*break*/, 4];
                        console.warn("Could not find any password associated with this email: ".concat(email, ", so we will check by user email"));
                        return [4 /*yield*/, UserAccount_1.UserAccount.select(function (ua) {
                                return [ua.email, ua.accountOf];
                            })
                                .where(function (ua) {
                                return ua.email.equals(email);
                            })
                                .one()];
                    case 2:
                        account_1 = _a.sent();
                        if (!account_1) {
                            return [2 /*return*/, {
                                    error: 'This email is not registered',
                                }];
                        }
                        return [4 /*yield*/, AuthCredential_js_1.AuthCredential.select(function (ac) {
                                return [
                                    ac.passwordHash,
                                    ac.credentialOf.select(function (p) {
                                        return [p.givenName, p.familyName, p.telephone];
                                    }),
                                ];
                            })
                                .where(function (ac) {
                                return ac.credentialOf.equals(account_1.accountOf);
                            })
                                .one()];
                    case 3:
                        existingCredential = _a.sent();
                        if (!existingCredential) {
                            return [2 /*return*/, {
                                    error: 'No password found for this email',
                                }];
                        }
                        _a.label = 4;
                    case 4: return [4 /*yield*/, password_js_1.default.checkPassword(plainPassword, existingCredential.passwordHash)];
                    case 5:
                        passwordIsValid = _a.sent();
                        if (!passwordIsValid) {
                            return [2 /*return*/, {
                                    error: 'Invalid email / password combination',
                                }];
                        }
                        person = existingCredential.credentialOf;
                        return [4 /*yield*/, this.getOrCreateAccount(person)];
                    case 6:
                        account = _a.sent();
                        return [2 /*return*/, auth_js_1.Auth.onSigninSuccessful(this, person, account)];
                }
            });
        });
    };
    /**
     * Create a new account
     *
     * @param CreateAccount - The account data to create
     * @returns
     */
    AuthBackendProvider.prototype.createAccount = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var webIDFromEmail, existingWebID;
            var _this = this;
            var firstName = _b.firstName, lastName = _b.lastName, email = _b.email, password = _b.password;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // check if the first name and email are provided
                        if (!firstName || !email) {
                            return [2 /*return*/, {
                                    error: 'No first name or email are provided',
                                }];
                        }
                        try {
                            webIDFromEmail = (0, webID_js_1.emailToWebID)(email);
                        }
                        catch (error) {
                            console.error("Invalid email format during account creation: ".concat(email), error);
                            return [2 /*return*/, {
                                    error: 'Invalid email format',
                                }];
                        }
                        return [4 /*yield*/, this.userShape
                                .select(function (p) { return [p.givenName, p.familyName, p.telephone]; })
                                .for(webIDFromEmail)];
                    case 1:
                        existingWebID = _c.sent();
                        if (existingWebID) {
                            console.warn("Account creation attempted with existing email: ".concat(email, " (webID: ").concat(webIDFromEmail, ")"));
                            return [2 /*return*/, {
                                    error: 'This email address is already in use. Please choose another email or log in with your existing account.',
                                    action: 'change_email_or_log_in',
                                }];
                        }
                        return [2 /*return*/, auth_js_1.Auth.login(this, function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    //we're not trying to log in with an existing account, a new one should be created
                                    return [2 /*return*/, null];
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                var user, passwordHash, newCredential, account;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.userShape
                                                .create({
                                                __id: webIDFromEmail,
                                                givenName: firstName,
                                                familyName: lastName,
                                                telephone: '',
                                            })
                                                .catch(function (err) {
                                                console.error("Error creating user ".concat(firstName, " ").concat(lastName, " - ").concat(email, ":"), err);
                                                throw new Error("Could not create user ".concat(firstName, " ").concat(lastName, " - ").concat(email));
                                            })];
                                        case 1:
                                            user = _a.sent();
                                            return [4 /*yield*/, password_js_1.default.generateHashedPassword(password)];
                                        case 2:
                                            passwordHash = _a.sent();
                                            return [4 /*yield*/, AuthCredential_js_1.AuthCredential.create({
                                                    credentialOf: {
                                                        id: user.id,
                                                    },
                                                    passwordHash: passwordHash,
                                                }).catch(function (err) {
                                                    console.error("Error creating password for user ".concat(user.id, ":"), err);
                                                    throw new Error("Could not create password for user ".concat(user.id));
                                                })];
                                        case 3:
                                            newCredential = _a.sent();
                                            console.log("created new password for ".concat(user.id));
                                            return [4 /*yield*/, this.accountShape
                                                    .create({
                                                    accountOf: user,
                                                    email: email,
                                                })
                                                    .catch(function (err) {
                                                    console.error("Error creating account for user ".concat(user.id, ":"), err);
                                                    throw new Error("Could not create account for user ".concat(user.id));
                                                })];
                                        case 4:
                                            account = _a.sent();
                                            console.log("new user:", JSON.stringify(user));
                                            console.log("new account:", JSON.stringify(account));
                                            return [2 /*return*/, {
                                                    account: account,
                                                    person: user,
                                                }];
                                    }
                                });
                            }); }, "createAccount - ".concat(firstName, " ").concat(lastName, " - ").concat(email))];
                }
            });
        });
    };
    /**
     * Get the password (AuthCredential) for a user
     *
     * @param user - The user
     * @returns The password (AuthCredential)
     */
    AuthBackendProvider.prototype.getPasswordForUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var credential;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, AuthCredential_js_1.AuthCredential.select(function (cred) {
                            return [
                                cred.passwordHash,
                                cred.credentialOf.select(function (p) {
                                    return [p.givenName, p.familyName, p.telephone];
                                }),
                            ];
                        })
                            .where(function (cred) {
                            return cred.credentialOf.equals({ id: user.id });
                        })
                            .one()];
                    case 1:
                        credential = _a.sent();
                        if (!credential) {
                            console.warn("Could not find any password for account ".concat(user.id));
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, credential];
                }
            });
        });
    };
    /**
     * Reset the password
     *
     * @param password - The new password
     * @param confirmPassword - The confirmed password
     * @param token - The reset password token
     * @returns
     */
    AuthBackendProvider.prototype.resetPassword = function (password, confirmPassword, token) {
        return __awaiter(this, void 0, void 0, function () {
            var user, _a, account, email, dbPassword, newHashedPassword, person;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // check if password and confirmPassword match
                        if (password !== confirmPassword) {
                            return [2 /*return*/, {
                                    error: 'Passwords do not match',
                                }];
                        }
                        if (!token) return [3 /*break*/, 2];
                        return [4 /*yield*/, password_js_1.default.validateResetPasswordToken(token)];
                    case 1:
                        _a = _d.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = (_c = (_b = this.request) === null || _b === void 0 ? void 0 : _b.linkedAuth) === null || _c === void 0 ? void 0 : _c.user;
                        _d.label = 3;
                    case 3:
                        user = _a;
                        if (!user) {
                            console.warn('No user account found to reset password');
                            return [2 /*return*/, {
                                    error: 'No user account found to reset password',
                                }];
                        }
                        return [4 /*yield*/, this.getOrCreateAccount(user)];
                    case 4:
                        account = _d.sent();
                        email = (0, webID_js_1.webIDToEmail)(user.id);
                        if (!email) {
                            console.warn("Could not extract email from webID during password reset: ".concat(user.id));
                            return [2 /*return*/, {
                                    error: 'Could not determine email address from user account',
                                }];
                        }
                        return [4 /*yield*/, this.getPasswordForUser(user)];
                    case 5:
                        dbPassword = _d.sent();
                        if (!!dbPassword) return [3 /*break*/, 7];
                        console.warn('Password not found for this account : ' +
                            user.id +
                            'creating one in order to reset password');
                        return [4 /*yield*/, AuthCredential_js_1.AuthCredential.createNewCredential(email, password, user)];
                    case 6:
                        _d.sent();
                        return [3 /*break*/, 10];
                    case 7: return [4 /*yield*/, password_js_1.default.generateHashedPassword(password)];
                    case 8:
                        newHashedPassword = _d.sent();
                        return [4 /*yield*/, AuthCredential_js_1.AuthCredential.update({
                                passwordHash: newHashedPassword,
                            }).for(dbPassword)];
                    case 9:
                        _d.sent();
                        _d.label = 10;
                    case 10:
                        person = user;
                        return [2 /*return*/, auth_js_1.Auth.onSigninSuccessful(this, person, account)];
                }
            });
        });
    };
    AuthBackendProvider.prototype.getOrCreateAccount = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var account;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.accountShape
                            .select(function (a) { return a.accountOf; })
                            .where(function (a) { return a.accountOf.equals({ id: user.id }); })
                            .one()];
                    case 1:
                        account = _a.sent();
                        if (!!account) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.accountShape.create({
                                accountOf: {
                                    id: user.id,
                                },
                            })];
                    case 2:
                        //accounts can be created on the fly,
                        // it means this user/webID existed, but it's the first time they log in here to this app
                        // use account.profileSetupComplete or similar if you want to direct the user to a profile setup page
                        account = _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, account];
                }
            });
        });
    };
    /**
     * Send the reset password link with zeptoMail
     *
     * @param email - The email address
     * @returns
     */
    AuthBackendProvider.prototype.sendResetPasswordLink = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var newToken, normalizedEmail, webID, existingCredential, account, person, confirmUrl, emailOptions;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        newToken = password_js_1.default.generateToken();
                        normalizedEmail = email.toLowerCase();
                        try {
                            webID = (0, webID_js_1.emailToWebID)(normalizedEmail);
                        }
                        catch (error) {
                            console.error("Invalid email format during password reset request: ".concat(email), error);
                            return [2 /*return*/, {
                                    error: 'Invalid email format',
                                }];
                        }
                        return [4 /*yield*/, this.getPasswordForUser({ id: webID })];
                    case 1:
                        existingCredential = _b.sent();
                        if (!!existingCredential) return [3 /*break*/, 4];
                        return [4 /*yield*/, UserAccount_1.UserAccount.select(function (ua) {
                                return [
                                    ua.email,
                                    ua.accountOf.select(function (p) {
                                        return [p.givenName, p.telephone];
                                    }),
                                ];
                            })
                                .where(function (ua) {
                                return ua.email.equals(normalizedEmail);
                            })
                                .one()];
                    case 2:
                        account = _b.sent();
                        if (!((_a = account === null || account === void 0 ? void 0 : account.accountOf) === null || _a === void 0 ? void 0 : _a.id)) {
                            console.warn("No account found for reset password email ".concat(email));
                            return [2 /*return*/, {
                                    error: 'No password is associated with this account. Please try another login method or contact support.',
                                }];
                        }
                        webID = account.accountOf.id;
                        return [4 /*yield*/, AuthCredential_js_1.AuthCredential.create({
                                credentialOf: {
                                    id: webID,
                                },
                                email: normalizedEmail,
                                telephone: account.accountOf.telephone || undefined,
                                forgotPasswordToken: newToken,
                            })];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, AuthCredential_js_1.AuthCredential.update({
                            forgotPasswordToken: newToken,
                        }).for(existingCredential)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, this.userShape
                            .select(function (u) { return u.givenName; })
                            .for({ id: webID })
                            .one()];
                    case 7:
                        person = _b.sent();
                        if (!person) {
                            console.warn("No user found for reset password webID ".concat(webID));
                            return [2 /*return*/, {
                                    error: 'We could not prepare the reset password link for this account.',
                                }];
                        }
                        confirmUrl = "".concat(process.env.SITE_ROOT, "/auth/reset-password?token=").concat(newToken);
                        emailOptions = {
                            to: [
                                {
                                    email_address: {
                                        address: email, // destination
                                        name: normalizedEmail, // recipient Name
                                    },
                                },
                            ],
                            subject: "Reset Your ".concat(process.env.APP_NAME, " Password"),
                            htmlbody: "\n          <table role='presentation' border='0' cellpadding='0' cellspacing='0' class='body' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fff; width: 100%;' width='100%' bgcolor='#fff'>\n            <tr>\n              <td>\n                <p>Hey ".concat(person.givenName, " \uD83D\uDC4B</p>\n                <p>Click the button below to reset your password:</p>\n                <a href='").concat(confirmUrl, "' target='_blank' style='border: solid 1px #3498db; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #3498db; border-color: #3498db; color: #ffffff;'>Reset Password</a>\n                <p>Cheers,</p>\n                <p>").concat(process.env.APP_NAME, " Team</p>\n              </td>\n            </tr>\n            <tr>\n              <td>\n                <p style='font-size: 12px; color: #999;'>Alternatively, you can also copy and paste the link into your browser:</p>\n                <a href='").concat(confirmUrl, "' target='_blank' style='font-size: 12px;'>").concat(confirmUrl, "</a>\n              </td>\n            </tr>\n          </table>\n        "),
                        };
                        // await this.zeptoMail.sendMail(emailOptions);
                        return [2 /*return*/, LinkedEmail_1.LinkedEmail.send(emailOptions)
                                .then(function () {
                                return true;
                            })
                                .catch(function (error) {
                                console.error('Error sending reset link:', error);
                                return {
                                    error: "Sorry, we couldn't send the email, please try again later",
                                };
                            })];
                }
            });
        });
    };
    /**
     * Sign in with OAuth provider
     *
     * @param provider - The OAuth provider
     * @param oauthUserData
     * @returns
     */
    AuthBackendProvider.prototype.signinOAuth = function (provider, oauthUserData) {
        return __awaiter(this, void 0, void 0, function () {
            var email, name, familyName, givenName, fullName, imageUrl, identityToken, _a, appleEmail, sub, idToken, googlePayload;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        email = oauthUserData.email, name = oauthUserData.name, familyName = oauthUserData.familyName, givenName = oauthUserData.givenName, fullName = oauthUserData.fullName, imageUrl = oauthUserData.imageUrl, identityToken = oauthUserData.identityToken;
                        console.log(provider +
                            ' oAuthData keys:' +
                            Object.keys(oauthUserData)
                                .filter(function (key) { return oauthUserData[key] && true; })
                                .join(', '));
                        if (!(provider === 'apple' && identityToken)) return [3 /*break*/, 2];
                        return [4 /*yield*/, apple_js_1.default.decodeIdentityToken(identityToken)];
                    case 1:
                        _a = _c.sent(), appleEmail = _a.email, sub = _a.sub;
                        // use extracted email from Apple token
                        email = appleEmail;
                        // store sub for later use when creating IdentityToken
                        oauthUserData._appleSub = sub;
                        console.log('Apple OAuth validated successfully for:', email);
                        _c.label = 2;
                    case 2:
                        if (!(provider === 'google')) return [3 /*break*/, 4];
                        idToken = (_b = oauthUserData.authentication) === null || _b === void 0 ? void 0 : _b.idToken;
                        if (!idToken) {
                            console.error('Google OAuth: No ID token provided');
                            return [2 /*return*/, { error: 'No Google ID token provided' }];
                        }
                        return [4 /*yield*/, google_js_1.default.validateIdToken(idToken)];
                    case 3:
                        googlePayload = _c.sent();
                        if (!googlePayload) {
                            console.error('Google OAuth: Invalid ID token');
                            return [2 /*return*/, { error: 'Invalid Google ID token' }];
                        }
                        // Extract user data from validated Google payload
                        email = googlePayload.email;
                        name = googlePayload.name;
                        givenName = googlePayload.given_name;
                        familyName = googlePayload.family_name;
                        console.log('Google OAuth validated successfully for:', email);
                        _c.label = 4;
                    case 4:
                        // Check if email is provided
                        if (!email) {
                            console.log('No email provided to signinOAuth: ', provider, oauthUserData);
                            return [2 /*return*/, { error: 'could not find email in OAuth response' }];
                        }
                        // use Auth.login pattern like createAccount for Google and other OAuth providers
                        return [2 /*return*/, auth_js_1.Auth.login(this, function () { return __awaiter(_this, void 0, void 0, function () {
                                var webID, existingAccount;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            try {
                                                webID = (0, webID_js_1.emailToWebID)(email);
                                            }
                                            catch (error) {
                                                console.error("Invalid email format during OAuth signin: ".concat(email), error);
                                                return [2 /*return*/, null];
                                            }
                                            return [4 /*yield*/, this.accountShape
                                                    .select(function (a) {
                                                    return [
                                                        a.email,
                                                        a.accountOf.select(function (p) { return [
                                                            p.givenName,
                                                            p.familyName,
                                                            p.telephone,
                                                        ]; }),
                                                    ];
                                                })
                                                    .where(function (a) {
                                                    return a.accountOf.equals({
                                                        id: webID,
                                                    });
                                                })
                                                    .one()];
                                        case 1:
                                            existingAccount = _a.sent();
                                            if (!existingAccount) {
                                                return [2 /*return*/, null];
                                            }
                                            return [2 /*return*/, {
                                                    account: existingAccount,
                                                    person: existingAccount.accountOf,
                                                }];
                                    }
                                });
                            }); }, function () { return __awaiter(_this, void 0, void 0, function () {
                                var webID, userData, user, newCredential, accountData, account;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            try {
                                                webID = (0, webID_js_1.emailToWebID)(email);
                                            }
                                            catch (error) {
                                                console.error("Invalid email format during OAuth account creation: ".concat(email), error);
                                                throw new Error("Could not create ".concat(provider, " account: invalid email format"));
                                            }
                                            userData = {
                                                __id: webID,
                                                givenName: givenName || '',
                                                familyName: familyName || '',
                                                telephone: '',
                                            };
                                            return [4 /*yield*/, this.userShape
                                                    .create(userData)
                                                    .catch(function (err) {
                                                    console.error("Error creating ".concat(provider, " user - ").concat(email, ":"), err);
                                                    throw new Error("Could not create ".concat(provider, " user - ").concat(email));
                                                })];
                                        case 1:
                                            user = _a.sent();
                                            return [4 /*yield*/, AuthCredential_js_1.AuthCredential.create({
                                                    credentialOf: {
                                                        id: user.id,
                                                    },
                                                    email: email,
                                                    // No passwordHash for OAuth users
                                                }).catch(function (err) {
                                                    console.error("Error creating credential for ".concat(provider, " user ").concat(user.id, ":"), err);
                                                    throw new Error("Could not create credential for ".concat(provider, " user ").concat(user.id));
                                                })];
                                        case 2:
                                            newCredential = _a.sent();
                                            console.log("created new credential for ".concat(user.id));
                                            accountData = {
                                                accountOf: user,
                                                email: email,
                                            };
                                            return [4 /*yield*/, this.accountShape
                                                    .create(accountData)
                                                    .catch(function (err) {
                                                    console.error("Error creating ".concat(provider, " account for user ").concat(user.id, ":"), err);
                                                    throw new Error("Could not create ".concat(provider, " account for user ").concat(user.id));
                                                })];
                                        case 3:
                                            account = _a.sent();
                                            if (!(provider === 'apple' && identityToken && oauthUserData._appleSub)) return [3 /*break*/, 5];
                                            return [4 /*yield*/, IdentityToken_js_1.IdentityToken.create({
                                                    token: identityToken,
                                                    email: email,
                                                    subject: oauthUserData._appleSub,
                                                    account: account,
                                                }).catch(function (err) {
                                                    console.error("Error creating Apple IdentityToken for user ".concat(user.id, ":"), err);
                                                    throw new Error("Could not create Apple IdentityToken for user ".concat(user.id));
                                                })];
                                        case 4:
                                            _a.sent();
                                            _a.label = 5;
                                        case 5:
                                            console.log("".concat(provider, " user created:"), JSON.stringify(user));
                                            console.log("".concat(provider, " account created:"), JSON.stringify(account));
                                            return [2 /*return*/, {
                                                    account: account,
                                                    person: user,
                                                }];
                                    }
                                });
                            }); }, "".concat(provider, " - ").concat(email))];
                }
            });
        });
    };
    /**
     * Temporary sign in without any credentials
     * TODO: how to make this support with WebID? since user doesn't have email
     *
     * Note: we not save AuthCredential for temporary user for now, you need to save it on different way. Example: on register form, etc..
     *
     * @returns
     */
    AuthBackendProvider.prototype.signinTemporary = function () {
        return __awaiter(this, void 0, void 0, function () {
            var person, account;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userShape
                            .create({
                            givenName: '',
                        })
                            .catch(function (err) {
                            console.error('Error creating temporary user:', err);
                            throw new Error('Error creating temporary user');
                        })];
                    case 1:
                        person = _a.sent();
                        console.log("Temporary person created: ".concat(person.id));
                        return [4 /*yield*/, this.accountShape
                                .create({
                                accountOf: person,
                            })
                                .catch(function (err) {
                                console.error('Error creating temporary account:', err);
                                throw new Error('Error creating temporary account');
                            })];
                    case 2:
                        account = _a.sent();
                        console.log("Temporary account created: ".concat(account.id));
                        account.accountOf = person;
                        return [4 /*yield*/, auth_js_1.Auth.onSigninSuccessful(this, person, account, true)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AuthBackendProvider.prototype.removeAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var auth, account, user, password;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auth = this.request.linkedAuth;
                        if (!auth) {
                            return [2 /*return*/, null];
                        }
                        account = auth.userAccount;
                        user = auth.user;
                        return [4 /*yield*/, (0, events_js_1.emitAccountWillBeRemovedEvent)(account)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.getPasswordForUser(user)];
                    case 2:
                        password = _a.sent();
                        if (!password) return [3 /*break*/, 4];
                        return [4 /*yield*/, AuthCredential_js_1.AuthCredential.delete(password)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: 
                    //remove account and user
                    return [4 /*yield*/, this.accountShape.delete(account)];
                    case 5:
                        //remove account and user
                        _a.sent();
                        return [4 /*yield*/, this.userShape.delete(user)];
                    case 6:
                        _a.sent();
                        console.log('Account has been deleted', account.id);
                        this.signout();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Sign out the user and remove the refresh token from the database
     *
     * @returns A promise that resolves to a boolean indicating the success of sign-out
     */
    AuthBackendProvider.prototype.signout = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        try {
                            var auth_1 = _this.request.linkedAuth;
                            if (!auth_1) {
                                resolve(false);
                                return;
                            }
                            resolve(true);
                        }
                        catch (err) {
                            console.warn('error during signout: ', err.toString());
                            reject(err);
                        }
                    })];
            });
        });
    };
    /**
     * Validate the bearer token header and return the authentication result
     *
     * @param refreshToken - Optional refresh token
     * @returns A promise that resolves to an authentication result
     */
    AuthBackendProvider.prototype.validateToken = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            var request, token, verificationResult, authentication, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = this.request;
                        token = this.getTokenFromRequest(request);
                        refreshToken = refreshToken || this.getRefreshTokenFromRequest(request);
                        if (!token) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, jwt_js_1.verifyToken)({
                                request: request,
                                token: token,
                                refreshToken: refreshToken,
                                provider: this,
                            })];
                    case 2:
                        verificationResult = _a.sent();
                        // if token is valid, set the authentication object
                        // and return the payload with new access token and refresh token
                        if (verificationResult) {
                            authentication = auth_js_1.Auth.setAuthentication(request, verificationResult.payload);
                            if (!authentication) {
                                return [2 /*return*/, {
                                        error: 'Invalid token',
                                    }];
                            }
                            return [2 /*return*/, {
                                    auth: authentication,
                                    accessToken: verificationResult.accessToken,
                                    refreshToken: verificationResult.refreshToken,
                                }];
                        }
                        else {
                            // if token is invalid, return error
                            return [2 /*return*/, {
                                    error: 'Invalid token',
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        // error while decoding token
                        return [2 /*return*/, {
                                error: 'Token decoding error',
                            }];
                    case 4: 
                    // no token found in Authorization header or cookies
                    return [2 /*return*/, {
                            error: 'No token found',
                        }];
                }
            });
        });
    };
    /**
     * Gets the access token from the request.
     * This method checks the Authorization header for a Bearer token
     * or looks for a cookie named 'accessToken'.
     * @param req
     * @protected
     */
    AuthBackendProvider.prototype.getTokenFromRequest = function (req) {
        if (req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.accessToken) {
            return req.cookies.accessToken;
        }
        return null;
    };
    // get refresh token from request
    AuthBackendProvider.prototype.getRefreshTokenFromRequest = function (req) {
        return req.cookies && req.cookies.refreshToken;
    };
    return AuthBackendProvider;
}(BackendProvider_1.BackendProvider));
exports.default = AuthBackendProvider;
//# sourceMappingURL=backend.js.map