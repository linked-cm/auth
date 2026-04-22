"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.ENFORCE_SIGNED_IN = void 0;
exports.ProvideAuth = ProvideAuth;
var react_1 = __importStar(require("react"));
var Server_1 = require("@_linked/server-utils/utils/Server");
var package_js_1 = require("../package.js");
var Person_1 = require("@_linked/schema/shapes/Person");
var UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
var useQueryContext_1 = require("@_linked/react/utils/useQueryContext");
var token_js_1 = require("../utils/token.js");
var AppContext_1 = require("@_linked/server-utils/components/AppContext");
exports.ENFORCE_SIGNED_IN = 'ENFORCE_SIGNIN';
var AuthContext = (0, react_1.createContext)(null);
// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
function ProvideAuth(_a) {
    var children = _a.children, 
    // userType = FoafPerson,
    // accountType = UserAccount,
    _b = _a.signinRoute, 
    // userType = FoafPerson,
    // accountType = UserAccount,
    signinRoute = _b === void 0 ? '' : _b, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _c = _a.availableAccountTypes, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    availableAccountTypes = _c === void 0 ? [] : _c;
    //Note: AvailableAccountTypes prop can be used to ensure that the App bundle that renders the provider
    // will include all the available account types. So that useAuth will work correctly when it uses getShapeOrSubShape to get the user account
    // we don't acutally use the property here, its just so that webpack bundles these account types
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    var auth = useProvideAuth(signinRoute);
    return react_1.default.createElement(AuthContext.Provider, { value: auth }, children);
}
// Hook for child components to get the auth object ...
// ... and re-render when it changes.
var useAuth = function () {
    var authContext = (0, react_1.useContext)(AuthContext);
    if (!authContext) {
        throw new Error('useAuth must be used within a ProvideAuth component');
    }
    return authContext;
};
exports.useAuth = useAuth;
// Provider hook that creates auth object and handles state
function useProvideAuth(signinRoute) {
    var _this = this;
    var _a, _b;
    if (signinRoute === void 0) { signinRoute = ''; }
    // userType: QResult = QResult<FoafPerson>,
    // accountType: QResult = QResult<UserAccount>,
    // For the backend: get the express request from the app context
    // and set the default auth to the linked auth or the first local auth
    var _c = (0, AppContext_1.useAppContext)(), requestObject = _c.requestObject, expressRequest = _c.expressRequest;
    var defaultAuth = (requestObject === null || requestObject === void 0 ? void 0 : requestObject.auth) || (expressRequest === null || expressRequest === void 0 ? void 0 : expressRequest.linkedAuth);
    // console.log(`defaultAuth: `, JSON.stringify(defaultAuth));
    var account, person;
    account = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.userAccount;
    person = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.user;
    //TODO? keep loadingUserData:boolean state
    //in useEffect, if userData state empty and/or if token changes
    // we execute 1 function, which executes all the queries to get the user and userAccount data
    // (many packages can defined such queries, so we need to execute them all)
    var _d = __read((0, react_1.useState)(defaultAuth), 2), auth = _d[0], setAuthState = _d[1];
    var _e = __read((0, react_1.useState)(person), 2), user = _e[0], setUser = _e[1]; //{id:...}
    var _f = __read((0, react_1.useState)(account), 2), userAccount = _f[0], setUserAccount = _f[1];
    //if no default auth is set, then validating = true
    var _g = __read((0, react_1.useState)(defaultAuth ? false : true), 2), validating = _g[0], setValidating = _g[1];
    (0, useQueryContext_1.useQueryContext)('user', user, Person_1.Person);
    (0, useQueryContext_1.useQueryContext)('userAccount', userAccount, UserAccount_1.UserAccount);
    // const navigate = useNavigate();
    (0, react_1.useEffect)(function () {
        //if the initial page request returned an auth object with updated tokens, then update state & tokens locally
        if (requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) {
            var newAccessToken = requestObject.linkedAuth.accessToken;
            var newRefreshToken = requestObject.linkedAuth.refreshToken;
            updateAuth({
                auth: auth,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        }
    }, [
        (_a = requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) === null || _a === void 0 ? void 0 : _a.accessToken,
        (_b = requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) === null || _b === void 0 ? void 0 : _b.refreshToken,
    ]);
    (0, react_1.useEffect)(function () {
        // register the action handler to enforce signed in
        Server_1.Server.registerActionHandler(exports.ENFORCE_SIGNED_IN, function (_a) {
            var preventDefault = _a.preventDefault;
            //logging out the user on the frontend should be sufficient redirect the user to the sign-in page if the app uses RequireAuth
            signout();
            preventDefault();
        });
        /**
         * Validate token on component mount
         */
        var startTokenValidation = function () { return __awaiter(_this, void 0, void 0, function () {
            var interval;
            var _this = this;
            return __generator(this, function (_a) {
                interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        validateToken();
                        return [2 /*return*/];
                    });
                }); }, (token_js_1.ACCESS_TOKEN_EXPIRES * 1000) / 5);
                // console.log(`validating token every ${ (ACCESS_TOKEN_EXPIRES * 1000) / 3} ms or ${ACCESS_TOKEN_EXPIRES / 3} seconds`);
                // clear interval on unmount
                return [2 /*return*/, function () {
                        clearInterval(interval);
                    }];
            });
        }); };
        startTokenValidation();
        if (!auth) {
            //Apps may have tokens but will not have an auth instance just yet
            //because they don't receive LD from the server since there is not initial page request
            // so we need to validate the token immediately
            // if valid tokens are present in the cookies, it will lead to a successful validation
            // if not, it will lead to a signout & redirect to the signin page
            setValidating(true);
            validateToken().then(function () {
                setValidating(false);
            });
        }
        // check if a token is already stored and set it as default header
        var getToken = function () { return __awaiter(_this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN)];
                    case 1:
                        token = _a.sent();
                        if (token) {
                            Server_1.Server.addDefaultHeaders({
                                Authorization: "Bearer ".concat(token),
                            });
                        }
                        else {
                            // signout();
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        getToken();
    }, []);
    // update the authentication instance and the user and userAccount
    var updateAuth = function (_a) {
        var auth = _a.auth, accessToken = _a.accessToken, refreshToken = _a.refreshToken;
        //update the hook state, so a rerender is triggered with the updated auth values
        setAuthState(auth);
        // update the user and userAccount before render
        setUser(auth.user);
        setUserAccount(auth.userAccount);
        // save token to storage only if provided
        if (accessToken) {
            (0, token_js_1.setAuthToken)({
                key: token_js_1.ACCESS_TOKEN,
                value: accessToken,
                expires: token_js_1.ACCESS_TOKEN_EXPIRES,
            });
            Server_1.Server.addDefaultHeaders({
                Authorization: "Bearer ".concat(accessToken),
            });
        }
        if (refreshToken) {
            (0, token_js_1.setAuthToken)({
                key: token_js_1.REFRESH_TOKEN,
                value: refreshToken,
                expires: token_js_1.REFRESH_TOKEN_EXPIRES,
            });
        }
        return {
            // user,
            // userAccount,
            auth: auth,
            accessToken: accessToken || '',
            refreshToken: refreshToken || '',
        };
    };
    var createAccount = function (data) {
        return Server_1.Server.call(package_js_1.packageName, 'createAccount', data).then(function (response) {
            if (response === null || response === void 0 ? void 0 : response.auth) {
                //update local auth
                updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
                return;
            }
            if (!response) {
                return { error: 'Something went wrong. Please contact support' };
            }
            if (response && response.error) {
                return { error: response.error };
            }
        });
    };
    var signinWithPassword = function (email, password) {
        return Server_1.Server.call(package_js_1.packageName, 'signinWithPassword', email, password).then(function (response) {
            if (response && response.auth) {
                return updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
            }
            else {
                //TODO: show user feedback
                throw new Error((response === null || response === void 0 ? void 0 : response.error) || "Couldn't sign in with password");
            }
        });
    };
    var signinOAuth = function (provider, source) {
        return Server_1.Server.call(package_js_1.packageName, 'signinOAuth', provider, source
        // userType,
        // accountType,
        ).then(function (response) {
            if (response && response.auth) {
                return updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
            }
            else {
                //TODO: show user feedback
                console.warn("Couldn't sign in with OAuth");
            }
        });
    };
    var signinTemporary = function () {
        return Server_1.Server.call(package_js_1.packageName, 'signinTemporary').then(function (response) {
            if (response && response.auth) {
                return updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
            }
            else {
                //TODO: show user feedback
                console.warn("Couldn't sign in temporary");
            }
        });
    };
    var signout = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // reset the authentication instance
                    setAuthState(null);
                    setUser(null);
                    setUserAccount(null);
                    // remove token from storage
                    (0, token_js_1.removeAuthToken)(token_js_1.ACCESS_TOKEN);
                    (0, token_js_1.removeAuthToken)(token_js_1.REFRESH_TOKEN);
                    return [4 /*yield*/, Server_1.Server.call(package_js_1.packageName, 'signout')];
                case 1:
                    result = _a.sent();
                    if (result) {
                        // hard refresh to redirect after signout
                        window.location.href = '/';
                    }
                    else {
                        return [2 /*return*/, {
                                error: 'signout failed',
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * Check the token still valid or not, need on Apps
     *
     * @returns boolean
     */
    var validateToken = function () { return __awaiter(_this, void 0, void 0, function () {
        var storedToken, refreshToken, undoSignin;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN)];
                case 1:
                    storedToken = _a.sent();
                    return [4 /*yield*/, (0, token_js_1.getAuthToken)(token_js_1.REFRESH_TOKEN)];
                case 2:
                    refreshToken = _a.sent();
                    undoSignin = function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            // remove userAccount and token when validate token is not valid or false
                            // need to remove userAccount for the RequireAuth to redirect to the sign-in page
                            setUserAccount(null);
                            (0, token_js_1.removeAuthToken)(token_js_1.ACCESS_TOKEN);
                            (0, token_js_1.removeAuthToken)(token_js_1.REFRESH_TOKEN);
                            return [2 /*return*/];
                        });
                    }); };
                    if (storedToken) {
                        return [2 /*return*/, Server_1.Server.call(package_js_1.packageName, 'validateToken', refreshToken)
                                .then(function (response) {
                                // check if response error
                                if (response.error) {
                                    undoSignin();
                                    return false;
                                }
                                return updateAuth({
                                    auth: response.auth,
                                    accessToken: response.accessToken,
                                    refreshToken: response.refreshToken,
                                });
                            })
                                .catch(function (err) {
                                return undoSignin();
                            })];
                    }
                    else {
                        return [2 /*return*/, undoSignin()];
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    /**
     * get the access token from storage
     * @returns
     */
    var getAccessToken = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN)];
        });
    }); };
    var removeAccount = function () {
        return Server_1.Server.call(package_js_1.packageName, 'removeAccount');
    };
    // Return the user object and auth methods
    return {
        user: user,
        userAccount: userAccount,
        signinOAuth: signinOAuth,
        signout: signout,
        updateAuth: updateAuth,
        signinWithPassword: signinWithPassword,
        signinTemporary: signinTemporary,
        createAccount: createAccount,
        validateToken: validateToken,
        getAccessToken: getAccessToken,
        removeAccount: removeAccount,
        validating: validating,
    };
}
/**
 * TODO: add this for better validation of tokens before they expire
 * import jwtDecode from "jwt-decode"; // or manual atob split

type Claims = { exp: number; iat?: number };

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleTokenRefresh(accessToken: string, refresh: () => Promise<void>) {
  // clear any previous timer
  if (refreshTimer) clearTimeout(refreshTimer);

  const { exp } = jwtDecode<Claims>(accessToken);
  if (!exp) return; // fallback: do nothing if missing

  const now = Date.now();
  const expMs = exp * 1000;
  const skewMs = 30_000;          // account for clock skew (30s)
  const bufferMs = 10 * 60_000;   // refresh 10 min early
  const when = Math.max(0, expMs - bufferMs - skewMs - now);

  refreshTimer = setTimeout(async () => {
    try {
      await refresh();            // your refresh-token call
    } catch {
      // optional: sign out or show relogin UI
    }
  }, when);
}

// call after login / page load / successful refresh:
scheduleTokenRefresh(accessToken, refreshFn);

// optional: reschedule when tab becomes active again
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    scheduleTokenRefresh(currentAccessToken, refreshFn);
  }
});
 */
//# sourceMappingURL=useAuth.js.map