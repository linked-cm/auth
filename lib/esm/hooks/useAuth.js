import React, { createContext, useContext, useEffect, useState } from 'react';
import { Server } from '@_linked/server-utils/utils/Server';
import { packageName } from '../package.js';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { useQueryContext } from '@_linked/react/utils/useQueryContext';
import { ACCESS_TOKEN, ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRES, getAuthToken, removeAuthToken, setAuthToken, } from '../utils/token.js';
import { useAppContext } from '@_linked/server-utils/components/AppContext';
export const ENFORCE_SIGNED_IN = 'ENFORCE_SIGNIN';
const AuthContext = createContext(null);
// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({ children, 
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
    return React.createElement(AuthContext.Provider, { value: auth }, children);
}
// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error('useAuth must be used within a ProvideAuth component');
    }
    return authContext;
};
// Provider hook that creates auth object and handles state
function useProvideAuth(signinRoute = '') {
    var _a, _b;
    // userType: QResult = QResult<FoafPerson>,
    // accountType: QResult = QResult<UserAccount>,
    // For the backend: get the express request from the app context
    // and set the default auth to the linked auth or the first local auth
    const { requestObject, expressRequest } = useAppContext();
    const defaultAuth = (requestObject === null || requestObject === void 0 ? void 0 : requestObject.auth) || (expressRequest === null || expressRequest === void 0 ? void 0 : expressRequest.linkedAuth);
    // console.log(`defaultAuth: `, JSON.stringify(defaultAuth));
    let account, person;
    account = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.userAccount;
    person = defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.user;
    //TODO? keep loadingUserData:boolean state
    //in useEffect, if userData state empty and/or if token changes
    // we execute 1 function, which executes all the queries to get the user and userAccount data
    // (many packages can defined such queries, so we need to execute them all)
    const [auth, setAuthState] = useState(defaultAuth);
    const [user, setUser] = useState(person); //{id:...}
    const [userAccount, setUserAccount] = useState(account);
    //if no default auth is set, then validating = true
    const [validating, setValidating] = useState(defaultAuth ? false : true);
    useQueryContext('user', user, SchemaPerson);
    useQueryContext('userAccount', userAccount, UserAccount);
    // const navigate = useNavigate();
    useEffect(() => {
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
    useEffect(() => {
        // register the action handler to enforce signed in
        Server.registerActionHandler(ENFORCE_SIGNED_IN, ({ preventDefault }) => {
            //logging out the user on the frontend should be sufficient redirect the user to the sign-in page if the app uses RequireAuth
            signout();
            preventDefault();
        });
        /**
         * Validate token on component mount
         */
        const startTokenValidation = async () => {
            // set interval to validate token every ACCESS_TOKEN_EXPIRES
            const interval = setInterval(async () => {
                validateToken();
                //TODO: replace interval with something better, see bottom of this file
            }, (ACCESS_TOKEN_EXPIRES * 1000) / 5);
            // console.log(`validating token every ${ (ACCESS_TOKEN_EXPIRES * 1000) / 3} ms or ${ACCESS_TOKEN_EXPIRES / 3} seconds`);
            // clear interval on unmount
            return () => {
                clearInterval(interval);
            };
        };
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
        const getToken = async () => {
            const token = await getAuthToken(ACCESS_TOKEN);
            if (token) {
                Server.addDefaultHeaders({
                    Authorization: `Bearer ${token}`,
                });
            }
            else {
                // signout();
            }
        };
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
            setAuthToken({
                key: ACCESS_TOKEN,
                value: accessToken,
                expires: ACCESS_TOKEN_EXPIRES,
            });
            Server.addDefaultHeaders({
                Authorization: `Bearer ${accessToken}`,
            });
        }
        if (refreshToken) {
            setAuthToken({
                key: REFRESH_TOKEN,
                value: refreshToken,
                expires: REFRESH_TOKEN_EXPIRES,
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
        return Server.call(packageName, 'createAccount', data).then((response) => {
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
        return Server.call(packageName, 'signinWithPassword', email, password).then((response) => {
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
        return Server.call(packageName, 'signinOAuth', provider, source
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
        return Server.call(packageName, 'signinTemporary').then((response) => {
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
    const signout = async () => {
        // reset the authentication instance
        setAuthState(null);
        setUser(null);
        setUserAccount(null);
        // remove token from storage
        removeAuthToken(ACCESS_TOKEN);
        removeAuthToken(REFRESH_TOKEN);
        const result = await Server.call(packageName, 'signout');
        if (result) {
            // hard refresh to redirect after signout
            window.location.href = '/';
        }
        else {
            return {
                error: 'signout failed',
            };
        }
    };
    /**
     * Check the token still valid or not, need on Apps
     *
     * @returns boolean
     */
    const validateToken = async () => {
        const storedToken = await getAuthToken(ACCESS_TOKEN);
        const refreshToken = await getAuthToken(REFRESH_TOKEN);
        //TODO: replace with already existing signout() function?
        const undoSignin = async () => {
            // remove userAccount and token when validate token is not valid or false
            // need to remove userAccount for the RequireAuth to redirect to the sign-in page
            setUserAccount(null);
            removeAuthToken(ACCESS_TOKEN);
            removeAuthToken(REFRESH_TOKEN);
        };
        if (storedToken) {
            return Server.call(packageName, 'validateToken', refreshToken)
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
    };
    /**
     * get the access token from storage
     * @returns
     */
    const getAccessToken = async () => {
        return getAuthToken(ACCESS_TOKEN);
    };
    const removeAccount = () => {
        return Server.call(packageName, 'removeAccount');
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