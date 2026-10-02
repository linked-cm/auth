import React, { createContext, useContext, useEffect, useState } from 'react';
import { Server } from '@_linked/server-utils/utils/Server';
import { packageName } from '../package.js';
import { Authentication } from '../shapes/Authentication.js';
import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import { UserAccount } from '@_linked/sioc/shapes/UserAccount';
import { Shape } from '@_linked/core/shapes/Shape';
import { useQueryContext } from '@_linked/react/utils/useQueryContext';
import {
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  getAuthToken,
  isNativeTokenStorage,
  removeAuthToken,
  storeAuthTokens,
} from '../utils/token.js';
import {
  getAccessTokenExpiresAt,
  hasSessionHint,
  installServerCallRetry,
  installVisibilityRefresh,
  refreshAccessToken,
  resetAuthClient,
  scheduleRefreshAt,
  setAccessToken,
  setRefreshHandler,
} from '../utils/authClient.js';
import type { RefreshTokenExpiry } from '../utils/token.js';
import { useAppContext } from '@_linked/server-utils/components/AppContext';
import type {
  OAuthProvider,
  AuthenticationResponse,
  AuthSession,
} from '../types/auth.js';
import { QResult } from '@_linked/core/queries/SelectQuery';
import type { UserData, UserAccountData } from '../types/auth.js';
import { useNavigate } from 'react-router-dom';

export const ENFORCE_SIGNED_IN = 'ENFORCE_SIGNIN';

const AuthContext = createContext(null);

interface AuthProviderProps {
  children: React.ReactNode;
  userType?: typeof Shape;
  accountType?: typeof UserAccount;
  availableAccountTypes?: (typeof UserAccount)[];
  signinRoute?: string;
}
// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({
  children,
  // accountType = UserAccount,
  signinRoute = '',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  availableAccountTypes = [],
}: AuthProviderProps) {
  //Note: AvailableAccountTypes prop can be used to ensure that the App bundle that renders the provider
  // will include all the available account types. So that useAuth will work correctly when it uses getShapeOrSubShape to get the user account
  // we don't acutally use the property here, its just so that webpack bundles these account types
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const auth = useProvideAuth(signinRoute);
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = <
  UserType extends UserData = UserData,
  AccountType extends UserAccountData = UserAccountData
>(): {
  user: UserType;
  userAccount: AccountType;
  updateAuth: ({
    auth,
    accessToken,
    refreshToken,
  }: {
    auth?: AuthSession<UserType, AccountType>;
    accessToken?: string;
    refreshToken?: string;
  } & RefreshTokenExpiry) => AuthenticationResponse;
  signinWithPassword: (
    email: string,
    password: string
  ) => Promise<AuthenticationResponse>;
  signinDev: (input: {
    webId: string;
    accessToken: string;
    refreshToken: string;
    email?: string;
  }) => Promise<AuthenticationResponse>;
  //TODO: remove this and change it into a backend call
  signinOAuth: (provider: OAuthProvider, whatelse?: any) => Promise<any>;
  createAccount: (data) => Promise<any>;
  signinTemporary: () => Promise<any>;
  signout: () => Promise<any>;
  validateToken: () => Promise<AuthenticationResponse | boolean>;
  getAccessToken: () => Promise<string>;
  removeAccount: () => Promise<boolean>;
  validating: boolean;
} => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error('useAuth must be used within a ProvideAuth component');
  }
  return authContext;
};

// Provider hook that creates auth object and handles state
function useProvideAuth(signinRoute: string = '') {
  // accountType: QResult = QResult<UserAccount>,
  // For the backend: get the express request from the app context
  // and set the default auth to the linked auth or the first local auth
  const { requestObject, expressRequest } = useAppContext();
  const defaultAuth = requestObject?.auth || expressRequest?.linkedAuth;

  // console.log(`defaultAuth: `, JSON.stringify(defaultAuth));
  let account, person;
  account = defaultAuth?.userAccount;
  person = defaultAuth?.user;

  //TODO? keep loadingUserData:boolean state
  //in useEffect, if userData state empty and/or if token changes
  // we execute 1 function, which executes all the queries to get the user and userAccount data
  // (many packages can defined such queries, so we need to execute them all)
  const [auth, setAuthState] = useState<AuthSession>(defaultAuth);
  const [user, setUser] = useState(person); //{id:...}
  const [userAccount, setUserAccount] = useState(account);
  //if no default auth is set, then validating = true
  const [validating, setValidating] = useState<boolean>(
    defaultAuth ? false : true
  );
  useQueryContext('user', user, SchemaPerson);
  useQueryContext('userAccount', userAccount, UserAccount);

  // const navigate = useNavigate();

  useEffect(() => {
    //if the initial page request returned an auth object with updated tokens, then update state & tokens locally
    if (requestObject?.linkedAuth) {
      let newAccessToken = requestObject.linkedAuth.accessToken;
      let newRefreshToken = requestObject.linkedAuth.refreshToken;

      updateAuth({
        auth,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        refreshTokenExpiresIn: requestObject.linkedAuth.refreshTokenExpiresIn,
        refreshTokenExpiresAt: requestObject.linkedAuth.refreshTokenExpiresAt,
      });
    }
  }, [
    requestObject?.linkedAuth?.accessToken,
    requestObject?.linkedAuth?.refreshToken,
  ]);

  useEffect(() => {
    // A call the server refused because the request was not signed in: most often an access
    // token that expired while the tab slept. Try one refresh before signing out.
    Server.registerActionHandler(ENFORCE_SIGNED_IN, ({ preventDefault }) => {
      preventDefault();
      refreshAccessToken().then((ok) => {
        if (!ok) signout();
      });
    });

    // Keep the session alive: refresh shortly before the access token expires (single flight),
    // again when the tab wakes up with a stale token, and once after a 401 (with one retry).
    const unregisterRefresh = setRefreshHandler(refreshSession);
    installServerCallRetry();
    const removeVisibilityRefresh = installVisibilityRefresh();

    // A server-rendered page knows the access token's expiry (the token itself is an httpOnly
    // cookie): schedule the refresh from it.
    const exp = (defaultAuth as any)?.exp;
    if (typeof exp === 'number' && getAccessTokenExpiresAt() === undefined) {
      scheduleRefreshAt(exp * 1000);
    }

    const init = async () => {
      if (isNativeTokenStorage()) {
        // native: the stored access token is sent as the Authorization header
        const token = await getAuthToken(ACCESS_TOKEN);
        if (token) setAccessToken(token);
      }
      if (!auth) {
        // No auth from a server render (apps, or an access cookie that expired). With a session
        // to refresh, validateToken renews it; without one, the user is simply signed out.
        if (isNativeTokenStorage() || hasSessionHint()) {
          setValidating(true);
          await validateToken();
        }
        setValidating(false);
      }
    };
    init();

    return () => {
      unregisterRefresh();
      removeVisibilityRefresh();
    };
  }, []);

  // update the authentication instance and the user and userAccount
  const updateAuth = ({
    auth,
    accessToken,
    refreshToken,
    refreshTokenExpiresIn,
    refreshTokenExpiresAt,
  }: {
    auth: AuthSession;
    accessToken: string;
    refreshToken: string;
    // when the server says the refresh token expires (absent from older servers)
    refreshTokenExpiresIn?: number;
    refreshTokenExpiresAt?: string;
    // TODO: which better use QResult or Shape?
    // user: QResult<Person>;
    // userAccount: QResult<UserAccount>;
  }): AuthenticationResponse => {
    //update the hook state, so a rerender is triggered with the updated auth values
    setAuthState(auth);

    // update the user and userAccount before render
    setUser(auth.user);
    setUserAccount(auth.userAccount);

    // save tokens to storage only if provided: the access cookie lives until the token's exp,
    // the refresh cookie until the expiry the server returned (see storeAuthTokens)
    storeAuthTokens({
      accessToken,
      refreshToken,
      refreshTokenExpiresIn,
      refreshTokenExpiresAt,
    }).catch((err) => console.warn('@_linked/auth: could not store tokens', err));

    if (accessToken) {
      // sent as the Authorization header; schedules the next refresh before its exp
      setAccessToken(accessToken);
    }

    return {
      // user,
      // userAccount,
      auth: auth,
      accessToken: accessToken || '',
      refreshToken: refreshToken || '',
      ...(refreshTokenExpiresIn !== undefined ? { refreshTokenExpiresIn } : {}),
      ...(refreshTokenExpiresAt !== undefined ? { refreshTokenExpiresAt } : {}),
    };
  };

  const createAccount = (data: {
    firstName;
    lastName;
    email;
    password;
  }): Promise<{ error: string }> => {
    return Server.call(packageName, 'createAccount', data).then((response) => {
      if (response?.auth) {
        //update local auth
        updateAuth({
          auth: response.auth,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          refreshTokenExpiresIn: response.refreshTokenExpiresIn,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
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

  const signinWithPassword = (email: string, password: string) => {
    return Server.call(packageName, 'signinWithPassword', email, password).then(
      (response: any) => {
        if (response && response.auth) {
          return updateAuth({
            auth: response.auth,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            refreshTokenExpiresIn: response.refreshTokenExpiresIn,
            refreshTokenExpiresAt: response.refreshTokenExpiresAt,
          });
        } else {
          //TODO: show user feedback
          throw new Error(response?.error || "Couldn't sign in with password");
        }
      }
    );
  };

  /**
   * Dev-mode webid.email signin. The frontend Signin page opens a /auth/dev
   * iframe, receives {webId, accessToken, refreshToken} via postMessage, and
   * calls this. Backend AuthBackendProvider.signinDev validates the JWT,
   * creates the UserAccount, returns the standard auth response.
   *
   * Phase 5.3 swaps the iframe URL to the real webid.email service —
   * this hook unchanged.
   */
  const signinDev = (input: {
    webId: string;
    accessToken: string;
    refreshToken: string;
    email?: string;
  }) => {
    return Server.call(packageName, 'signinDev', input).then((response: any) => {
      if (response && response.auth) {
        return updateAuth({
          auth: response.auth,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          refreshTokenExpiresIn: response.refreshTokenExpiresIn,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
        });
      }
      throw new Error(response?.error || "Couldn't sign in (dev)");
    });
  };

  const signinOAuth = (provider: string, source?: any) => {
    return Server.call(
      packageName,
      'signinOAuth',
      provider,
      source
      // userType,
      // accountType,
    ).then((response) => {
      if (response && response.auth) {
        return updateAuth({
          auth: response.auth,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          refreshTokenExpiresIn: response.refreshTokenExpiresIn,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
        });
      } else {
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
          refreshTokenExpiresIn: response.refreshTokenExpiresIn,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
        });
      } else {
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

    // native clients pass their refresh token; browsers send the httpOnly cookie, which the
    // server clears along with the access cookie
    const refreshToken = isNativeTokenStorage()
      ? await getAuthToken(REFRESH_TOKEN)
      : undefined;

    setAccessToken(null);
    resetAuthClient();
    removeAuthToken(ACCESS_TOKEN);
    removeAuthToken(REFRESH_TOKEN);

    const result = await Server.call(packageName, 'signout', refreshToken);
    if (result) {
      // hard refresh to redirect after signout
      window.location.href = '/';
    } else {
      return {
        error: 'signout failed',
      };
    }
  };

  /** Forget the session locally (the server already refused it). */
  const undoSignin = async () => {
    // need to remove userAccount for the RequireAuth to redirect to the sign-in page
    setUserAccount(null);
    setAccessToken(null);
    removeAuthToken(ACCESS_TOKEN);
    removeAuthToken(REFRESH_TOKEN);
  };

  /**
   * Ask the server for the current session: it confirms a valid access token, or refreshes with
   * the refresh token (the httpOnly cookie, or the stored token on native clients).
   */
  const callValidateToken = async (forceRefresh = false) => {
    const refreshToken = isNativeTokenStorage()
      ? await getAuthToken(REFRESH_TOKEN)
      : undefined;
    return Server.call(
      packageName,
      'validateToken',
      refreshToken,
      forceRefresh ? { forceRefresh: true } : undefined
    );
  };

  /**
   * Check whether the session is still valid (refreshing it if the access token expired).
   *
   * @returns the authentication response, or false when signed out
   */
  const validateToken = async () => {
    try {
      const response = await callValidateToken();
      if (!response || response.error) {
        await undoSignin();
        return false;
      }
      return updateAuth({
        auth: response.auth,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        refreshTokenExpiresIn: response.refreshTokenExpiresIn,
        refreshTokenExpiresAt: response.refreshTokenExpiresAt,
      });
    } catch (err) {
      await undoSignin();
      return false;
    }
  };

  /**
   * The refresh the scheduler, the focus handler and the 401 retry run (single flight, see
   * utils/authClient). A network error keeps the session: the next attempt may succeed.
   */
  const refreshSession = async (): Promise<boolean> => {
    let response;
    try {
      response = await callValidateToken(true);
    } catch (err) {
      console.warn('@_linked/auth: could not refresh the session', err);
      return false;
    }
    if (!response) {
      // no answer (server error): keep the session, the next attempt may succeed
      return false;
    }
    if (response.error || !response.accessToken) {
      await undoSignin();
      return false;
    }
    updateAuth({
      auth: response.auth,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      refreshTokenExpiresIn: response.refreshTokenExpiresIn,
      refreshTokenExpiresAt: response.refreshTokenExpiresAt,
    });
    return true;
  };

  /**
   * The access token held in memory (web) or storage (native). After a server-rendered page
   * load a web client has none until its first refresh: the token is an httpOnly cookie.
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
    signinDev,
    signinTemporary,
    createAccount,
    validateToken,
    getAccessToken,
    removeAccount,
    validating,
  };
}
