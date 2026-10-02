---
'@_linked/auth': major
---

Server-set httpOnly auth cookies, a client refresh scheduler, 15-minute access tokens and session lifetime limits.

**Breaking for browser clients**

- The server now sets the auth cookies itself: `accessToken` (httpOnly, SameSite=Lax, Path=/, until the JWT `exp`), `refreshToken` (httpOnly, SameSite=Strict, Path=`/call/@_linked/auth`, until the stored expiry) and `linkedAuthSession` (a readable `1`, no secret). `Secure` follows `req.secure` (set Express `trust proxy` behind a TLS proxy) or an https `SITE_ROOT`. JavaScript can no longer read any auth cookie, and js-cookie is gone.
- Browsers no longer receive `refreshToken` in response bodies. Native clients that call `setAuthTokenStorageMethods` still do: the client then sends `x-linked-auth-transport: body`. Other non-browser clients (scripts, tests) can send that header too.
- `getAccessToken()` returns the access token held in memory; right after a server-rendered page load there is none until the first refresh (the page itself was authenticated by the cookie).
- The default access token lifetime outside development is now 15 minutes (was 10 days); development is 1 hour (was 24 hours). `AUTH_ACCESS_TOKEN_TTL` still overrides it.

**New**

- Refresh scheduler: refreshes about 60 s before the access token expires, and when the tab becomes visible or focused with a stale token. Concurrent refreshes share one request. A `Server.call` that gets a 401 refreshes once and is retried once (auth wraps `LincdServerProxy.prototype.fetchWithRetry` until @_linked/server-utils has a hook for it). `ENFORCE_SIGNIN` tries one refresh before signing out.
- Session limits: `AUTH_SESSION_IDLE_TTL` (default 7 days without a refresh) and `AUTH_SESSION_MAX_TTL` (default 60 days after sign-in), `0` turns either off. A new optional `auth:sessionStartedAt` is stored on `RefreshToken`; older records fall back to their session's first `createdAt`.
- `cleanupExpiredSessions(store?, {olderThan})` deletes refresh token records revoked or expired more than 30 days ago (`AUTH_SESSION_CLEANUP_AFTER`). The backend provider runs it in the background at most once a day per process; `AUTH_SESSION_CLEANUP=false` turns that off.
- `validateToken(refreshToken?, {forceRefresh})`; signing out and a failed refresh clear the cookies.
- Cookie overrides: `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_DOMAIN`, `AUTH_REFRESH_COOKIE_PATH`.

**Migrating an app**

- Remove any code that reads or writes the `accessToken`/`refreshToken` cookies from JavaScript; keep the server reading `request.cookies.accessToken` or, better, `request.linkedAuth`.
- Behind a TLS-terminating proxy, set `app.set('trust proxy', …)`.
- If the frontend is served from another site than the API, set `AUTH_COOKIE_SAMESITE=none`.
- Users stay signed in: a refresh cookie written by the previous client on `/` is still accepted once and replaced by the scoped one.
