---
summary: >
  Steps 1-3 done. Close the token holes in @_linked/auth (refresh tokens accepted as access tokens, hard-coded
  secret fallbacks, a verification cache that serves expired tokens) and make refresh actually
  work: opaque refresh tokens stored as SHA-256 hashes, rotated on every use, with reuse
  detection and revocation on sign-out, password reset and account removal. Step 3: server-set
  httpOnly cookies, a client refresh scheduler with single-flight refresh and retry-on-401,
  15-minute access tokens, idle/absolute session limits and cleanup of old records.
---

# 001 — Token security and stored refresh tokens

## Problems found (on `origin/main` at 2f6d8e6)

| # | Problem | Evidence |
|---|---|---|
| 1 | Access and refresh token are the **same JWT payload** (the whole AuthSession) signed with the same secret. Access gets `aud=SITE_ROOT`, refresh gets no `aud`; neither has `typ`/`jti`. | `src/utils/jwt.ts:61-77` |
| 2 | `verifyToken` does `jwt.verify` with no audience or type check, so a **refresh token is accepted as an access token** — a 60-day login in production. The `expressjwt` middleware has no `audience` either. | `src/utils/jwt.ts:129`, `src/backend.ts:105-121` |
| 3 | Secret fallbacks: `JWT_SECRET` falls back to the literal `'jwt-secret'` in every environment; `SESSION_SECRET` falls back to `md5(filename)` outside development (only a warning). Anyone can mint tokens for a deployment that forgot the variable. | `src/utils/jwt.ts:8`, `src/backend.ts:106`, `src/backend.ts:134-148` |
| 4 | **Refresh never succeeds.** The refresh path requires a `RefreshToken` row with `token == <raw JWT>`, but the write in `onSigninSuccessful` is commented out ("it only lives on the front-end") and nothing else creates one. Measured: the local `cn-main` dataset holds 0 `auth:RefreshToken` nodes (and 35 `auth:AuthCredential`, as a control). | `src/utils/jwt.ts:148-166`, `src/utils/auth.ts:126-134` |
| 5 | Nothing is revoked: `signout` only returns true; `resetPassword` revokes nothing; the `accountWillBeRemoved` listener deletes rows that never exist. | `src/backend.ts:1034-1048`, `src/backend.ts:477-545`, `src/backend.ts:71-81` |
| 6 | The middleware refresh path mints a new access token and never sends it to the client. The client only gets new tokens from the `validateToken` RPC, which it polls every `ACCESS_TOKEN_EXPIRES/5` (2 days in production); the refresh scheduler is a commented TODO. | `src/utils/jwt.ts:193-210`, `src/backend.ts:1057-1110`, `src/hooks/useAuth.tsx:158-162,443-483` |
| 7 | `cachedTokenVerifications` caches by token for `ACCESS_TOKEN_EXPIRES` from **first use**, not until the token's own `exp` — an expired token is served as valid for up to one more lifetime — and is never pruned. | `src/utils/jwt.ts:15-28,107-119,237-241` |
| 8 | Lifetimes are hard-coded with wrong comments ("1 hour" for 24 h, "24 hours" for 30/60 days); cookies are set with js-cookie passing **seconds as days** (an access cookie for 864 000 days). | `src/utils/token.ts:25-46,80-82` |
| 9 | `updateSessionData` re-signs `request.linkedAuth`, which (after token auth) still carries `aud`/`iss`/`sub`; `jwt.sign` refuses a payload `aud` together with `options.audience`. | `src/utils/jwt.ts:11-14`, `src/utils/auth.ts:192` |
| 10 | `removeAccount` passes whole query results (with nested data) to `delete()`, which rejects them (`Invalid node reference`), so account removal fails. Found by the integration test. | `src/backend.ts:1014-1021` |

Create Now also verifies tokens itself with its own `jwt.verify` and the same `'jwt-secret'`
fallback (`create_now/src/backend.ts` ~169-191, `reconstructLinkedAuthFromToken`) — it accepts
refresh tokens as access tokens too. That is a CN follow-up once this ships (use `verifyAccessToken`).

## Step 1 — token kinds and required secrets

- Access token claims: `typ:'access'`, `aud=SITE_ROOT`, `sid` (session id), `jti` (random),
  plus the AuthSession payload as before. Reserved/kind claims are stripped from any payload
  before re-signing (fixes #9).
- Every access verification (`verifyToken`, `verifyAccessToken`, the `expressjwt` middleware,
  `validateRequestToken`) accepts only `typ:'access'` with the expected `aud`.
  **Legacy tokens without `typ`** are accepted as access only if they carry the expected `aud` —
  old access tokens do, old refresh tokens don't. Nobody is signed out; refresh-as-login is closed.
- New export `verifyAccessToken(token, {audience?})` for apps (CN) instead of their own `jwt.verify`.
- Outside `NODE_ENV=development|test`, startup (`setupBeforeControllers`) throws if `JWT_SECRET`
  or `SESSION_SECRET` is unset, with `openssl rand -base64 48` in the message. Development keeps
  the old fallbacks (`'jwt-secret'`, `md5(filename)`) and warns once.
- Verification cache: entries are evicted at the token's own `exp`, the cache is bounded, and only
  successful access verifications are cached. (Measured ~0.28 ms per `jsonwebtoken` verify, so a
  small cache is worth keeping; the bug was the expiry rule, not the cache.)
- Lifetimes configurable via `AUTH_ACCESS_TOKEN_TTL` / `AUTH_REFRESH_TOKEN_TTL` (seconds); defaults
  unchanged (dev 24 h / 30 d, otherwise 10 d / 60 d). js-cookie gets days.

## Step 2 — stored, hashed, rotated refresh tokens

- Refresh token = 32 random bytes, base64url (opaque, not a JWT). Only `SHA-256(token)` is stored.
- Record (one per issued token): `tokenHash`, `account`, `sessionId` (the family shared by every
  rotation of one sign-in), `createdAt`, `lastUsedAt`, `expiresAt`, `revokedAt`, `replacedBy`.
- Created wherever tokens are minted: `createToken` itself stores the record, so
  `onSigninSuccessful` (password, OAuth, temporary, dev, createAccount, resetPassword) and CN's
  `/auth/dev` all get a working refresh token. `updateSessionData` re-issues an access token in the
  same session and keeps the client's refresh token (no rotation from a side effect).
- Refresh happens in the `validateToken` RPC — the only path that can hand new tokens to the client
  (the client contract is unchanged; it now also calls it when only the refresh token is left).
  The request middleware no longer refreshes: rotating there would issue tokens nobody receives,
  and the next refresh would then look like token theft.
- Refresh: look up by hash → reject unknown / revoked / expired → create the replacement in the same
  session, then mark the old one `revokedAt` + `replacedBy` → reload the account and person and run
  the `initialAuthSession`/`extendAuthSession` hooks as at sign-in → new access token.
  Expiry is sliding: each new refresh token is valid for the full refresh lifetime.
- Reuse of a replaced token → the whole session is revoked. Within 30 s of the rotation, while the
  session is still alive, it is treated as a concurrent tab: a new access token, no new refresh
  token (the client keeps the one the other tab stored). Concurrent refreshes within one process
  are serialised per token.
- `signout` revokes the current session (from the access token's `sid`, or from the refresh token
  the client now passes). `resetPassword` (also used for a signed-in password change) revokes every
  session of the account before signing the current device in again. Removing an account deletes
  its records.
- Legacy JWT refresh tokens were never stored, so they cannot be validated: they are rejected. The
  user signs in again when the access token expires — which is what happens today, because refresh
  never worked.

### Storage / shape decision

What existed: the `RefreshToken` shape (`auth:RefreshToken`, `auth:token` = raw JWT string,
`auth:account` → `sioc:UserAccount`), unchanged since the package was extracted from the lincd.org
monorepo (d719e06). The store write was already commented out in that first commit. No raw token or
hash was ever persisted (0 nodes in local `cn-main`). No schema.org shape or term was ever used for
tokens; schema.org is only used for `Person`. `@_linked/schema` has no Token/Session-like shape
(closest terms: `schema:identifier`, `schema:dateCreated`, `schema:dateModified`).

Options:

- **A. Extend `RefreshToken` in the auth ontology (chosen).** Keep the class, the module path and
  `auth:account`; replace `auth:token` with `auth:tokenHash`; add `auth:sessionId`,
  `auth:createdAt`, `auth:lastUsedAt`, `auth:expiresAt`, `auth:revokedAt`, `auth:replacedBy`
  (dates as `xsd:dateTime`). Create Now pins this shape to `cn-main` by its import path
  (`@_linked/auth/shapes/RefreshToken` in `linked.backend.storage.js`), so keeping the class and path
  means no CN routing change — a renamed shape would fall through to CN's app-data router, which
  throws when there is no project context. Records live wherever the app routes `RefreshToken`
  (CN: `cn-main`, next to `AuthCredential`).
- **B. A separate `auth:Session` shape plus per-token records.** Normalised (account, device,
  createdAt, revokedAt on the session; hash/replacedBy on the token). Better once there is a
  "your active sessions" UI or idle-timeout bookkeeping; costs a second shape, a second pin in every
  app and an extra query per refresh. Natural evolution of A: `sessionId` already groups the records.
- **C. schema.org terms** (`schema:identifier`, `schema:dateCreated`, `schema:expires`…). Saves a few
  terms but mixes vocabularies for a security record no other app consumes, and gives nothing a query
  needs. Not recommended.

Recommendation: A now; B when session management UI or idle timeout is built. Note the auth
namespace is still `http://lincd.org/ont/auth/` — renaming it is a separate migration, not part of
this work.

## Step 3 — server-set cookies, refresh scheduler, session lifetime (done)

Status: [x] server-set cookies · [x] client scheduler + single flight + 401 retry · [x] 15 min
access tokens · [x] idle timeout + absolute lifetime · [x] cleanup job ·
[ ] `Server.call` auth hook in @_linked/server-utils (follow-up; auth wraps the proxy until then) ·
[ ] CN: `reconstructLinkedAuthFromToken` → `verifyAccessToken` (still open from step 1).

### Transport

| Cookie (set by the server) | httpOnly | SameSite | Path | Max-Age |
|---|---|---|---|---|
| `accessToken` | yes | Lax | `/` | the JWT's `exp` |
| `refreshToken` | yes | Strict | `/call/@_linked/auth` | the record's `expiresAt` |
| `linkedAuthSession` = `1` | no | Lax | `/` | as the refresh token |

- **Access token**: httpOnly cookie for full page loads (SSR — the middleware already read the
  `accessToken` cookie, so `request.linkedAuth` keeps working unchanged), **plus** the token in the
  response body, which the client keeps in memory only and sends as `Authorization: Bearer` with
  `Server.call`. Lax, so following a link from another site still renders signed in.
  The server tries the Bearer header first and falls back to the cookie, so a stale in-memory
  token does not hide a cookie another tab renewed.
- **Refresh token**: httpOnly, Strict, and scoped to this package's RPC path, so it travels only to
  `validateToken`/`signout`/sign-in calls — never with page loads, assets or other packages' RPCs.
  It is removed from response bodies for browsers. Strict does not break the dev iframe sign-in:
  CN's `/auth/dev` iframe is same-origin and the cookies are set by the parent's `signinDev` RPC,
  a same-site fetch. (A frontend on another site needs `AUTH_COOKIE_SAMESITE=none`.)
- **Hint cookie** (`linkedAuthSession`, no secret): tells the client a refresh cookie exists, so an
  anonymous page load does not pay a refresh round trip. Legacy JS cookies count as a hint too.
- **Secure**: `req.secure` (honours `trust proxy`) or `SITE_ROOT` https. A https SITE_ROOT with an
  http request logs a one-time warning to set `trust proxy`; cookies stay Secure (browsers reach
  the site over https anyway). Overrides: `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAMESITE`,
  `AUTH_COOKIE_DOMAIN`, `AUTH_REFRESH_COOKIE_PATH`.
- **Native** (`setAuthTokenStorageMethods`): unchanged storage functions; registering them adds the
  header `x-linked-auth-transport: body`, and only then does the server put the refresh token in the
  body. Native clients keep passing it to `validateToken`/`signout`.
- **Sign-out / failed refresh**: the server clears all three cookies (and a legacy `refreshToken`
  on `/`). Sign-in clears a legacy `/` refresh cookie too. js-cookie is gone.
- Cookies are set through `request.res` / the provider's `response`; a call with no writable
  response (SSR-local `Server.call` after headers were sent, tests) just skips them.

Considered and not done: refreshing during SSR (would need the refresh cookie on `/`, sent with
every request, plus rotation from the middleware). Instead an SSR page load past the access
token's expiry renders anonymous and the client refreshes on mount (RequireAuth already shows its
loading state while validating). An open tab keeps the access cookie fresh, so reloads during use
render signed in.

### Client

`src/utils/authClient.ts` (no React): `setAccessToken` (memory + `Authorization` header +
schedule), `scheduleRefreshAt(exp)` (for SSR, where only `exp` is known — from the rendered
`auth.exp`), `refreshAccessToken` (single flight), `installVisibilityRefresh`
(visibilitychange/focus when stale), `installServerCallRetry` (refresh before sending with an
expired token; on 401 refresh once and retry once; auth's own `/call/@_linked/auth/` calls are
never intercepted; a 401 within 10 s of a successful refresh does not trigger another refresh).
A refresh that returns the same `exp` (nothing to rotate) is not rescheduled 60 s before it, so
the scheduler cannot loop. `useAuth` registers the refresh (`validateToken` with
`{forceRefresh: true}`), replaces the polling interval, and on `ENFORCE_SIGNIN` first tries one
refresh before signing out. A refresh that gets no answer (server error) keeps the session.

`Server.call` has no hook for this, so auth wraps `LincdServerProxy.prototype.fetchWithRetry`
(present in server-utils 1.4–1.6; every HTTP `Server.call`/`customPost` goes through it). If a
future server-utils exposes `LincdServerProxy.setAuthHandler`, auth uses that instead.
**Follow-up for @_linked/server-utils** (separate PR):

```ts
interface ServerCallAuthHandler {
  /** Before each fetch (may await a refresh). */
  beforeRequest?(url: string, init: RequestInit): Promise<void> | void;
  /** After a 401. Resolve true to retry ONCE, rebuilt from the current default headers. */
  onUnauthorized?(url: string, response: Response): Promise<boolean> | boolean;
}
static setAuthHandler(handler: ServerCallAuthHandler | null): void;
```

called from `fetchBackend` around `fetchWithRetry` (and ideally `callCustomShapeMethod`, which
uses bare `fetch` without default headers today). Not covered by the retry: `ENFORCE_SIGNIN`
responses (HTTP 200 with `__action`) — handled by the refresh-then-sign-out action handler, but
the call itself returns `undefined`.

### Lifetimes

| Var | development | otherwise |
|---|---|---|
| `AUTH_ACCESS_TOKEN_TTL` | 3600 | **900** (was 864000) |
| `AUTH_REFRESH_TOKEN_TTL` | 2592000 | 5184000 (unchanged) |
| `AUTH_SESSION_IDLE_TTL` | 604800 | 604800 (`0` = off) |
| `AUTH_SESSION_MAX_TTL` | 5184000 | 5184000 (`0` = off) |

Development keeps an hour so a paused debugger or a restarting dev server does not cost a
sign-in and the refresh does not flood the dev log; it still exercises the scheduler. The refresh
TTL stays as the upper bound; in practice the idle timeout (7 d) caps each refresh token sooner.

### Session lifetime

- New optional property `auth:sessionStartedAt` on `RefreshToken`, copied to every rotation.
  Records from 2.0.x without it fall back to the earliest `createdAt` of their session (one
  extra query, only for those records).
- New refresh tokens expire at `min(now + refresh TTL, now + idle TTL, sessionStartedAt + max TTL)`.
- A refresh also checks the limits explicitly (`lastUsedAt` for idle, session start for max), so
  records issued before the limits existed or were lowered are caught; that revokes the session
  (reasons `idle` / `session-expired`).
- Idle is measured from the last refresh: with 15 min access tokens an open app refreshes every
  ~14 min, so it approximates "last time the app was open".

### Cleanup

`cleanupExpiredSessions(store?, {olderThan, now})` (default `olderThan` 30 days or
`AUTH_SESSION_CLEANUP_AFTER`) deletes records revoked or expired before the cutoff — recently
revoked ones stay, because reuse detection needs them. Uses a new optional store method
`findStale(cutoff)` (graph: two date-range queries). The provider's setup starts a background run
5 min after startup and then daily, at most once per day per process (also across HMR re-setup),
timer `unref`'d, errors logged; `AUTH_SESSION_CLEANUP=false` turns it off.

### Contract changes (major)

- Browsers no longer get `refreshToken` in response bodies; JS cannot read any auth cookie.
  `getAccessToken()` returns the in-memory token (none right after an SSR page load until the
  first refresh). Apps that read `document.cookie`/js-cookie for tokens must stop.
- `validateToken(refreshToken?, {forceRefresh?})`; `AuthenticationResult.refreshToken` is optional.
- `GraphRefreshSessionStore.create` now also persists `revokedAt`/`replacedBy` when given.

### Tests

Unit (`npm test`): `test/cookies.test.mjs` (real HTTP: flags, maxAge, body without refresh token,
native body transport, SSR with only the access cookie, stale Bearer + valid cookie, cookie-only
refresh/rotation, failed refresh clears, sign-out clears incl. legacy `/` cookie, Secure via trusted
proxy / not via untrusted header / not on http, overrides, default TTLs per NODE_ENV),
`test/session-lifetime.test.mjs` (idle, absolute, legacy start fallback, `0` = off, cleanup),
`test/authClient.test.mjs` (scheduler timing, no reschedule loop, SSR schedule from exp, visibility,
single flight, 401 → refresh → retry once, no loop, failed refresh not retried, concurrent 401s
share one refresh, auth calls not intercepted, pre-send refresh, web memory-only storage, native
storage + body-transport header). Against the 2.0.1 build: 22 of the 23 cookie/lifetime tests and
the whole client file (module missing) fail; the native-body test passes on both, as it should.
Integration (Fuseki): browser cookies + rotation + sign-out against the store, idle, absolute,
legacy-start fallback via the graph, cleanup via the graph date queries — 5 new, all failing on
2.0.1.

## Migration impact

- Logged-in users stay logged in: their access tokens (with `aud`) keep working until they expire.
- Their **legacy refresh tokens are invalid**; when the access token expires they sign in again
  (today's behaviour too).
- **Startup requires `JWT_SECRET` and `SESSION_SECRET` outside `NODE_ENV=development|test`**
  (that includes an unset NODE_ENV and `staging`).
- `RefreshToken.removeRefreshToken` / `getRefreshTokenForAccount` are removed (they matched on the raw
  token that was never stored); use `revokeSession`, `revokeAllSessionsForAccount`,
  `deleteAllSessionsForAccount` from `@_linked/auth/utils/sessions`.
- The access cookie now really expires with the access token; the client refreshes with the refresh
  token when the access token is gone.

## Env vars

| Var | Required | Default |
|---|---|---|
| `JWT_SECRET` | yes, outside development/test | dev: `'jwt-secret'` (warns) |
| `SESSION_SECRET` | yes, outside development/test | dev: md5 of the module filename (warns) |
| `SITE_ROOT` | yes (access-token audience) | — |
| `AUTH_ACCESS_TOKEN_TTL` | no | dev 3600, otherwise 900 (seconds; 86400/864000 before step 3) |
| `AUTH_REFRESH_TOKEN_TTL` | no | dev 2592000, otherwise 5184000 (seconds) |
| `AUTH_SESSION_IDLE_TTL` / `AUTH_SESSION_MAX_TTL` | no | 604800 / 5184000 (`0` = off) |
| `AUTH_SESSION_CLEANUP` / `AUTH_SESSION_CLEANUP_AFTER` | no | on / 2592000 |
| `AUTH_COOKIE_SECURE` / `AUTH_COOKIE_SAMESITE` / `AUTH_COOKIE_DOMAIN` / `AUTH_REFRESH_COOKIE_PATH` | no | auto / per cookie / host / `/call/@_linked/auth` |

## Test plan

Package (`npm test`, no services; runs in CI):
- refresh token (legacy JWT and new opaque) presented as Bearer → anonymous; access token presented as
  refresh → rejected;
- legacy access token without `typ` but with `aud` accepted; legacy refresh token without `aud` refused;
- rotation: refresh returns a new pair, the old token is then rejected; reuse after the grace window
  revokes the session; reuse inside it yields an access token only;
- sign-out revokes (refresh fails afterwards); password reset revokes every session of the account;
- missing `JWT_SECRET` / `SESSION_SECRET` in production throws at startup;
- the cache does not serve an expired token.

Package integration (`npm run test:integration`, needs Fuseki; throwaway dataset created and dropped
by the test): the same flows end to end through `createAccount` / `validateToken` / `signout` /
`resetPassword` against the real `RefreshToken` shape queries.

Create Now, after release (master agent, Playwright, short TTLs e.g. `AUTH_ACCESS_TOKEN_TTL=60`):
sign in → wait past access expiry → **reload** → the session survives via refresh (the client's
validation interval is computed from the client-side default lifetime, since `AUTH_*_TTL` is not
visible in the browser, so without a reload an open tab only refreshes on that interval — the
scheduler follow-up fixes this); reuse of an old refresh token
revokes the session; sign out → refresh fails; a refresh token sent as Bearer is refused.
