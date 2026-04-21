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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.ProvideAuth = exports.ENFORCE_SIGNED_IN = void 0;
const react_1 = __importStar(require("react"));
const Server_1 = require("@_linked/server-utils/utils/Server");
const package_js_1 = require("../package.js");
const Person_1 = require("@_linked/schema/shapes/Person");
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
const useQueryContext_1 = require("@_linked/react/utils/useQueryContext");
const token_js_1 = require("../utils/token.js");
const AppContext_1 = require("@_linked/server-utils/components/AppContext");
exports.ENFORCE_SIGNED_IN = 'ENFORCE_SIGNIN';
const AuthContext = (0, react_1.createContext)(null);
// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
function ProvideAuth({ children, 
// userType = FoafPerson,
// accountType = UserAccount,
signinRoute = '', 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
availableAccountTypes = [], }) {
    //Note: AvailableAccountTypes prop can be used to ensure that the App bundle that renders the provider
    // will include all the available account types. So that useAuth will work correctly when it uses getShapeOrSubShape to get the user account
    // we don't acutally use the property here, its just so that webpack bundles these account types
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const auth = useProvideAuth(signinRoute);
    return react_1.default.createElement(AuthContext.Provider, { value: auth }, children);
}
exports.ProvideAuth = ProvideAuth;
// Hook for child components to get the auth object ...
// ... and re-render when it changes.
const useAuth = () => {
    const authContext = (0, react_1.useContext)(AuthContext);
    if (!authContext) {
        throw new Error('useAuth must be used within a ProvideAuth component');
    }
    return authContext;
};
exports.useAuth = useAuth;
// Provider hook that creates auth object and handles state
function useProvideAuth(signinRoute = '') {
    var _a, _b;
    // userType: QResult = QResult<FoafPerson>,
    // accountType: QResult = QResult<UserAccount>,
    // For the backend: get the express request from the app context
    // and set the default auth to the linked auth or the first local auth
    const { requestObject, expressRequest } = (0, AppContext_1.useAppContext)();
    const defaultAuth = (requestObject === null || requestObject === void 0 ? void 0 : requestObject.auth) || (expressRequest === null || expressRequest === void 0 ? void 0 : expressRequest.linkedAuth);
    // console.log(`defaultAuth: `, JSON.stringify(defaultAuth));
    let account, person;
    account = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.userAccount;
    person = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.user;
    //TODO? keep loadingUserData:boolean state
    //in useEffect, if userData state empty and/or if token changes
    // we execute 1 function, which executes all the queries to get the user and userAccount data
    // (many packages can defined such queries, so we need to execute them all)
    const [auth, setAuthState] = (0, react_1.useState)(defaultAuth);
    const [user, setUser] = (0, react_1.useState)(person); //{id:...}
    const [userAccount, setUserAccount] = (0, react_1.useState)(account);
    //if no default auth is set, then validating = true
    const [validating, setValidating] = (0, react_1.useState)(defaultAuth ? false : true);
    (0, useQueryContext_1.useQueryContext)('user', user, Person_1.Person);
    (0, useQueryContext_1.useQueryContext)('userAccount', userAccount, UserAccount_1.UserAccount);
    // const navigate = useNavigate();
    (0, react_1.useEffect)(() => {
        //if the initial page request returned an auth object with updated tokens, then update state & tokens locally
        if (requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) {
            let newAccessToken = requestObject.linkedAuth.accessToken;
            let newRefreshToken = requestObject.linkedAuth.refreshToken;
            updateAuth({
                auth,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            });
        }
    }, [
        (_a = requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) === null || _a === void 0 ? void 0 : _a.accessToken,
        (_b = requestObject === null || requestObject === void 0 ? void 0 : requestObject.linkedAuth) === null || _b === void 0 ? void 0 : _b.refreshToken,
    ]);
    (0, react_1.useEffect)(() => {
        // register the action handler to enforce signed in
        Server_1.Server.registerActionHandler(exports.ENFORCE_SIGNED_IN, ({ preventDefault }) => {
            //logging out the user on the frontend should be sufficient redirect the user to the sign-in page if the app uses RequireAuth
            signout();
            preventDefault();
        });
        /**
         * Validate token on component mount
         */
        const startTokenValidation = () => __awaiter(this, void 0, void 0, function* () {
            // set interval to validate token every ACCESS_TOKEN_EXPIRES
            const interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                validateToken();
                //TODO: replace interval with something better, see bottom of this file
            }), (token_js_1.ACCESS_TOKEN_EXPIRES * 1000) / 5);
            // console.log(`validating token every ${ (ACCESS_TOKEN_EXPIRES * 1000) / 3} ms or ${ACCESS_TOKEN_EXPIRES / 3} seconds`);
            // clear interval on unmount
            return () => {
                clearInterval(interval);
            };
        });
        startTokenValidation();
        if (!auth) {
            //Apps may have tokens but will not have an auth instance just yet
            //because they don't receive LD from the server since there is not initial page request
            // so we need to validate the token immediately
            // if valid tokens are present in the cookies, it will lead to a successful validation
            // if not, it will lead to a signout & redirect to the signin page
            setValidating(true);
            validateToken().then(() => {
                setValidating(false);
            });
        }
        // check if a token is already stored and set it as default header
        const getToken = () => __awaiter(this, void 0, void 0, function* () {
            const token = yield (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN);
            if (token) {
                Server_1.Server.addDefaultHeaders({
                    Authorization: `Bearer ${token}`,
                });
            }
            else {
                // signout();
            }
        });
        getToken();
    }, []);
    // update the authentication instance and the user and userAccount
    const updateAuth = ({ auth, accessToken, refreshToken, }) => {
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
                Authorization: `Bearer ${accessToken}`,
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
    const createAccount = (data) => {
        return Server_1.Server.call(package_js_1.packageName, 'createAccount', data).then((response) => {
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
    const signinWithPassword = (email, password) => {
        return Server_1.Server.call(package_js_1.packageName, 'signinWithPassword', email, password).then((response) => {
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
    const signinOAuth = (provider, source) => {
        return Server_1.Server.call(package_js_1.packageName, 'signinOAuth', provider, source
        // userType,
        // accountType,
        ).then((response) => {
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
    const signinTemporary = () => {
        return Server_1.Server.call(package_js_1.packageName, 'signinTemporary').then((response) => {
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
    const signout = () => __awaiter(this, void 0, void 0, function* () {
        // reset the authentication instance
        setAuthState(null);
        setUser(null);
        setUserAccount(null);
        // remove token from storage
        (0, token_js_1.removeAuthToken)(token_js_1.ACCESS_TOKEN);
        (0, token_js_1.removeAuthToken)(token_js_1.REFRESH_TOKEN);
        const result = yield Server_1.Server.call(package_js_1.packageName, 'signout');
        if (result) {
            // hard refresh to redirect after signout
            window.location.href = '/';
        }
        else {
            return {
                error: 'signout failed',
            };
        }
    });
    /**
     * Check the token still valid or not, need on Apps
     *
     * @returns boolean
     */
    const validateToken = () => __awaiter(this, void 0, void 0, function* () {
        const storedToken = yield (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN);
        const refreshToken = yield (0, token_js_1.getAuthToken)(token_js_1.REFRESH_TOKEN);
        //TODO: replace with already existing signout() function?
        const undoSignin = () => __awaiter(this, void 0, void 0, function* () {
            // remove userAccount and token when validate token is not valid or false
            // need to remove userAccount for the RequireAuth to redirect to the sign-in page
            setUserAccount(null);
            (0, token_js_1.removeAuthToken)(token_js_1.ACCESS_TOKEN);
            (0, token_js_1.removeAuthToken)(token_js_1.REFRESH_TOKEN);
        });
        if (storedToken) {
            return Server_1.Server.call(package_js_1.packageName, 'validateToken', refreshToken)
                .then((response) => {
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
                .catch((err) => {
                return undoSignin();
            });
        }
        else {
            return undoSignin();
        }
    });
    /**
     * get the access token from storage
     * @returns
     */
    const getAccessToken = () => __awaiter(this, void 0, void 0, function* () {
        return (0, token_js_1.getAuthToken)(token_js_1.ACCESS_TOKEN);
    });
    const removeAccount = () => {
        return Server_1.Server.call(package_js_1.packageName, 'removeAccount');
    };
    // Return the user object and auth methods
    return {
        user,
        userAccount,
        signinOAuth,
        signout,
        updateAuth,
        signinWithPassword,
        signinTemporary,
        createAccount,
        validateToken,
        getAccessToken,
        removeAccount,
        validating,
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