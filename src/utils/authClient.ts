/**
 * The client side of keeping a session alive (browser and native; no React).
 *
 * - **Scheduler**: refreshes the access token REFRESH_LEAD_MS (60 s) before its `exp`, and again
 *   when the page becomes visible or focused with a token that is (nearly) expired — timers are
 *   throttled or frozen in background tabs and while a laptop sleeps.
 * - **Single flight**: every caller that needs a refresh at the same moment (scheduler, focus,
 *   several failing calls) shares ONE in-flight refresh.
 * - **Retry on 401**: a `Server.call` whose response is 401 triggers one refresh and is retried
 *   once with the new token. A call about to be sent with an already expired token refreshes
 *   first. Calls to this package's own endpoints are never intercepted (they ARE the refresh).
 *
 * The refresh itself (the `validateToken` RPC and updating React state) is registered by
 * `ProvideAuth` through `setRefreshHandler`, so this module has no React dependency and can be
 * tested on its own.
 */
import { Server } from '@_linked/server-utils/utils/Server';
import { LincdServerProxy } from '@_linked/server-utils/utils/LincdServerProxy';
import { jwtExpiryMs } from './token.js';

/** Refresh this long before the access token expires. */
export const REFRESH_LEAD_MS = 60 * 1000;
/** Never schedule a refresh sooner than this after the previous one (guards against loops). */
const MIN_REFRESH_DELAY_MS = 5 * 1000;
/** setTimeout's maximum delay (about 24.8 days); longer delays fire immediately. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;
/** The path prefix of this package's RPC endpoints — never intercepted. */
const AUTH_CALL_PATH = '/call/@_linked/auth/';
/** The cookie the server sets (readable, no secret) while a refresh cookie exists. */
export const SESSION_HINT_COOKIE = 'linkedAuthSession';

/** Performs a refresh; resolves true when a new access token was obtained. */
export type RefreshHandler = () => Promise<boolean>;

let refreshHandler: RefreshHandler | undefined;
let inFlight: Promise<boolean> | undefined;
let lastRefreshAtMs = 0;
/**
 * A 401 within this long after a successful refresh is not about an expired token (the app
 * refused the call for another reason), so it does not trigger yet another refresh.
 */
const FRESH_TOKEN_WINDOW_MS = 10 * 1000;
let accessToken: string | undefined;
let accessTokenExpiresAtMs: number | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let listenersInstalled = false;

/** Register what a refresh does. Returns a function that unregisters it. */
export function setRefreshHandler(handler: RefreshHandler | undefined): () => void {
  refreshHandler = handler;
  return () => {
    if (refreshHandler === handler) refreshHandler = undefined;
  };
}

/**
 * Refresh the session now. Concurrent callers share one refresh (single flight). Resolves true
 * when a new access token was obtained, false when the refresh failed or nothing is registered.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (inFlight) return inFlight;
  const handler = refreshHandler;
  if (!handler) return Promise.resolve(false);
  inFlight = Promise.resolve()
    .then(handler)
    .then(
      (ok) => {
        if (ok) lastRefreshAtMs = Date.now();
        return Boolean(ok);
      },
      (err) => {
        console.warn('@_linked/auth: refresh failed', err);
        return false;
      }
    )
    .finally(() => {
      inFlight = undefined;
    });
  return inFlight;
}

/** The access token currently held in memory (web) or last set (native). */
export function getCurrentAccessToken(): string | undefined {
  return accessToken;
}

/** When the current access token expires (ms since epoch), if known. */
export function getAccessTokenExpiresAt(): number | undefined {
  return accessTokenExpiresAtMs;
}

/**
 * Use this access token from now on: it is sent as the `Authorization` header with every
 * `Server.call`, and the next refresh is scheduled REFRESH_LEAD_MS before its `exp`.
 * `null` forgets it (sign-out): the header is removed and nothing is scheduled.
 */
export function setAccessToken(token: string | null | undefined, nowMs: number = Date.now()) {
  if (!token) {
    accessToken = undefined;
    accessTokenExpiresAtMs = undefined;
    clearScheduledRefresh();
    try {
      Server.removeDefaultHeaders('Authorization');
    } catch {
      // older server-utils without removeDefaultHeaders
    }
    return;
  }
  const previousExpiry = accessTokenExpiresAtMs;
  accessToken = token;
  try {
    Server.addDefaultHeaders({ Authorization: `Bearer ${token}` });
  } catch {
    // no server proxy (SITE_ROOT unset)
  }
  const expMs = jwtExpiryMs(token);
  if (expMs !== undefined) {
    // A refresh that returned a token expiring no later than the one we had (the server had no
    // refresh token to rotate) must not be rescheduled 60 s before that same exp — that would
    // loop. Check again at expiry instead; by then a refresh either works or signs out.
    const sameAsBefore = previousExpiry !== undefined && expMs <= previousExpiry;
    scheduleRefreshAt(expMs, nowMs, sameAsBefore ? 0 : REFRESH_LEAD_MS);
  } else {
    // not a readable JWT: nothing to schedule from
    accessTokenExpiresAtMs = undefined;
    clearScheduledRefresh();
  }
}

/**
 * Schedule the next refresh for a token that expires at `expMs` without holding the token
 * itself — after a server-rendered page load, the access token is an httpOnly cookie and the
 * client only knows its `exp` (from the auth data the server rendered).
 */
export function scheduleRefreshAt(
  expMs: number,
  nowMs: number = Date.now(),
  leadMs: number = REFRESH_LEAD_MS
) {
  accessTokenExpiresAtMs = expMs;
  clearScheduledRefresh();
  const delay = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_REFRESH_DELAY_MS, expMs - leadMs - nowMs));
  timer = setTimeout(() => {
    timer = undefined;
    refreshAccessToken();
  }, delay);
  (timer as any)?.unref?.();
}

export function clearScheduledRefresh() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

/** Is the access token expired, or about to (within REFRESH_LEAD_MS)? */
export function accessTokenNeedsRefresh(nowMs: number = Date.now()): boolean {
  return accessTokenExpiresAtMs !== undefined && nowMs >= accessTokenExpiresAtMs - REFRESH_LEAD_MS;
}

/** Called on visibilitychange / focus: refresh if the token expired while the tab slept. */
export function refreshIfStale(nowMs: number = Date.now()): Promise<boolean> | undefined {
  if (!accessTokenNeedsRefresh(nowMs)) return undefined;
  return refreshAccessToken();
}

/**
 * Refresh when the page comes back (visible / focused) with a stale token. Idempotent; returns
 * a function that removes the listeners.
 */
export function installVisibilityRefresh(): () => void {
  if (listenersInstalled || typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') refreshIfStale();
  };
  const onFocus = () => refreshIfStale();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onFocus);
  listenersInstalled = true;
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', onFocus);
    listenersInstalled = false;
  };
}

/** Does the browser hold a session the server could refresh? (cookie hint; web only) */
export function hasSessionHint(): boolean {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') return false;
  // the hint the server sets, or cookies written from JS by releases before server-set cookies
  return /(?:^|;\s*)(linkedAuthSession|refreshToken|accessToken)=/.test(document.cookie);
}

// ---------------------------------------------------------------------------------------------
// Retry on 401
// ---------------------------------------------------------------------------------------------

type FetchLike = (url: string, init: RequestInit, retries?: number) => Promise<Response>;

/**
 * The hook a future @_linked/server-utils exposes for this (see the package docs). Until it
 * exists, `installServerCallRetry` wraps `LincdServerProxy.prototype.fetchWithRetry`, the single
 * function every `Server.call` / `customPost` over HTTP goes through.
 */
interface ServerCallAuthHandler {
  beforeRequest?(url: string, init: RequestInit): Promise<void> | void;
  onUnauthorized?(url: string, response: Response): Promise<boolean> | boolean;
}

function isAuthCall(url: string): boolean {
  try {
    return new URL(url, 'http://local').pathname.startsWith(AUTH_CALL_PATH);
  } catch {
    return url.includes(AUTH_CALL_PATH);
  }
}

function withCurrentAuthorization(init: RequestInit): RequestInit {
  const headers: Record<string, string> = { ...((init?.headers as any) || {}) };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    // web after a server-rendered load: the renewed httpOnly cookie authenticates the retry
    delete headers.Authorization;
  }
  return { ...init, headers };
}

/** Before a call: if the token is already expired, refresh first (the call would fail anyway). */
async function beforeRequest(url: string): Promise<void> {
  if (isAuthCall(url) || accessTokenExpiresAtMs === undefined) return;
  if (Date.now() >= accessTokenExpiresAtMs) {
    await refreshAccessToken();
  }
}

/** After a 401: refresh once; true means "retry with the new token". */
async function onUnauthorized(url: string): Promise<boolean> {
  if (isAuthCall(url) || !refreshHandler) return false;
  if (!inFlight && Date.now() - lastRefreshAtMs < FRESH_TOKEN_WINDOW_MS) return false;
  return refreshAccessToken();
}

/**
 * Wrap a fetch function with the refresh rules: refresh before sending with an expired token,
 * and after a 401 refresh once and retry once. The retry's response is returned as is — a second
 * 401 goes to the caller, so this cannot loop.
 */
export function withAuthRetry(fetchFn: FetchLike): FetchLike {
  return async function (this: any, url: string, init: RequestInit, ...rest: any[]) {
    await beforeRequest(url);
    const sentInit = withCurrentAuthIfChanged(init);
    const first = await fetchFn.call(this, url, sentInit, ...rest);
    if (first?.status !== 401 || isAuthCall(url)) return first;
    // Another call refreshed while this one was under way: just retry with the new token.
    const tokenChanged =
      accessToken !== undefined &&
      (sentInit?.headers as any)?.Authorization !== `Bearer ${accessToken}`;
    if (!tokenChanged && !(await onUnauthorized(url))) return first;
    return fetchFn.call(this, url, withCurrentAuthorization(init), ...rest);
  };
}

/** Use the newest token if the call was prepared with an older one (it refreshed meanwhile). */
function withCurrentAuthIfChanged(init: RequestInit): RequestInit {
  const sent = (init?.headers as any)?.Authorization;
  if (sent && accessToken && sent !== `Bearer ${accessToken}`) {
    return withCurrentAuthorization(init);
  }
  return init;
}

let retryInstalled = false;

/**
 * Make `Server.call` refresh and retry once on 401. Idempotent.
 *
 * Uses `LincdServerProxy.setAuthHandler` when @_linked/server-utils provides it; otherwise wraps
 * `LincdServerProxy.prototype.fetchWithRetry` (present since server-utils 1.4). With neither,
 * calls are not retried — the scheduler still refreshes ahead of expiry — and a warning is logged.
 * Returns false in that case.
 */
export function installServerCallRetry(): boolean {
  if (retryInstalled) return true;
  const proxyClass: any = LincdServerProxy;
  if (typeof proxyClass?.setAuthHandler === 'function') {
    const handler: ServerCallAuthHandler = {
      beforeRequest: (url) => beforeRequest(url),
      onUnauthorized: (url) => onUnauthorized(url),
    };
    proxyClass.setAuthHandler(handler);
    retryInstalled = true;
    return true;
  }
  const proto = proxyClass?.prototype;
  if (proto && typeof proto.fetchWithRetry === 'function') {
    proto.fetchWithRetry = withAuthRetry(proto.fetchWithRetry);
    retryInstalled = true;
    return true;
  }
  console.warn(
    '@_linked/auth: this @_linked/server-utils has no hook for retrying calls after a refresh; ' +
      'a call made with an expired token fails once before the session is refreshed.'
  );
  return false;
}

/** Reset all client state (tests, sign-out). Does not uninstall the retry wrapper. */
export function resetAuthClient() {
  clearScheduledRefresh();
  accessToken = undefined;
  accessTokenExpiresAtMs = undefined;
  inFlight = undefined;
  lastRefreshAtMs = 0;
}
