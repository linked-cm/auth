import React from 'react';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
import { Shape } from '@_linked/core/shapes/Shape';
import { OAuthProvider, AuthenticationResponse, AuthSession } from '../types/auth.js';
import { UserAccountData } from '../types/auth.js';
export declare const ENFORCE_SIGNED_IN = "ENFORCE_SIGNIN";
interface AuthProviderProps {
    children: React.ReactNode;
    userType?: typeof Shape;
    accountType?: typeof UserAccount;
    availableAccountTypes?: (typeof UserAccount)[];
    signinRoute?: string;
}
export declare function ProvideAuth({ children, signinRoute, availableAccountTypes, }: AuthProviderProps): React.JSX.Element;
export declare const useAuth: <UserType extends {
    id: string;
} = {
    id: string;
}, AccountType extends UserAccountData = UserAccountData>() => {
    user: UserType;
    userAccount: AccountType;
    updateAuth: ({ auth, accessToken, refreshToken, }: {
        auth?: AuthSession<UserType, AccountType>;
        accessToken?: string;
        refreshToken?: string;
    }) => AuthenticationResponse;
    signinWithPassword: (email: string, password: string) => Promise<AuthenticationResponse>;
    signinOAuth: (provider: OAuthProvider, whatelse?: any) => Promise<any>;
    createAccount: (data) => Promise<any>;
    signinTemporary: () => Promise<any>;
    signout: () => Promise<any>;
    validateToken: () => Promise<AuthenticationResponse | boolean>;
    getAccessToken: () => Promise<string>;
    removeAccount: () => Promise<boolean>;
    validating: boolean;
};
export {};
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
