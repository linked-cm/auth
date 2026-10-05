# `@_linked/auth`

Portable authentication for Linked applications. The package provides session handling, password authentication, verified OAuth sign-in, account resolution, and React helpers.

## Application setup

Wrap the client application with `ProvideAuth` and supply its user and account shapes.

The Auth package facilitates authentication in your application using JSON Web Tokens (JWT). It employs `express-jwt` for stateless authentication. In browsers the **server** sets the tokens as httpOnly cookies; native apps (Capacitor) register their own storage with `setAuthTokenStorageMethods`.

Signing in returns two tokens:

- an **access token** — a JWT (`typ: 'access'`, `aud` = `SITE_ROOT`, `sid` = the session) that authenticates requests as a Bearer header or `accessToken` cookie;
- a **refresh token** — an opaque random value. Only its SHA-256 hash is stored (as a `RefreshToken` shape, through your app's storage — route it like `AuthCredential`). `validateToken` exchanges it for new tokens and **rotates** it: the old one stops working, and presenting it again revokes the session. Signing out revokes the session; a password reset revokes all of the account's sessions.

A refresh token is never accepted as an access token. Apps that verify tokens themselves should use `verifyAccessToken` from `@_linked/auth/utils/jwt` instead of `jwt.verify`.

Default lifetimes: the access token lasts **15 minutes** (1 hour in development) and the client refreshes it about a minute before it expires. A session ends after **7 days without a refresh** (idle timeout) and at the latest **60 days after sign-in** (absolute lifetime). Each refresh token expires at the earliest of `AUTH_REFRESH_TOKEN_TTL` (60 days, 30 in development), the idle timeout and the absolute lifetime.

### How tokens travel (browsers)

| Cookie (set by the server) | httpOnly | SameSite | Path | Lifetime |
|---|---|---|---|---|
| `accessToken` | yes | Lax | `/` | until the token's `exp` |
| `refreshToken` | yes | Strict | `/call/@_linked/auth` | until the stored record's expiry |
| `linkedAuthSession` (`1`, no secret) | no | Lax | `/` | as the refresh token |

- The access cookie authenticates full page loads (server-side rendering sets `request.linkedAuth` from it). The client also keeps the access token from the response body **in memory** and sends it as the `Authorization` header with `Server.call`.
- The refresh token is only sent to this package's endpoints and never appears in a response body a browser can read. `validateToken` reads it from the cookie and sets new cookies.
- `linkedAuthSession` lets the client know a session exists without exposing it, so anonymous page loads skip the refresh round trip.
- Signing out (and a failed refresh) clears all three.
- `Secure` is set when the request is https (`req.secure`) or `SITE_ROOT` is https. **Behind a TLS-terminating proxy, set `app.set('trust proxy', …)`** so `req.secure` (and `req.ip`) reflect the client connection.

The client refreshes ~60 s before the access token's `exp`, again when the tab becomes visible or focused with a stale token, and once after a `Server.call` gets a 401 (then retries that call once). Concurrent refreshes share one request.

### Native apps

Call `setAuthTokenStorageMethods(get, set, remove)` (from `@_linked/auth/utils/token`) before rendering `ProvideAuth`. The client then sends `x-linked-auth-transport: body`, the server returns the refresh token in the response body, and both tokens are stored through your functions (`expires` in seconds). Other non-browser clients (scripts, tests) can send that header too.

## Upgrading from 1.x: migrate stored auth data

2.0 moves auth's ontology from `http://lincd.org/ont/auth/` to `https://linked.cm/ont/auth/`. Every auth class and property changed IRI, so credentials, refresh tokens and the synced shape descriptions written by 1.x are **invisible** to 2.0 until they are rewritten: sign-in answers "No password found for this email". Nothing is lost; the data just has to be migrated once per dataset that auth shapes are stored in (wherever your storage config routes `AuthCredential`, `RefreshToken`, `Password`, `IdentityToken` and `Authentication`).

```ts
import {
  migrateAuthNamespace,
  hasLegacyAuthData,
} from '@_linked/auth/utils/migrateNamespace';

// `store` is the dataset itself (e.g. the FusekiStore), not a dataset router.
console.log(await migrateAuthNamespace(store, { dryRun: true })); // { before: N, after: N, ... }
console.log(await migrateAuthNamespace(store)); // { before: N, after: 0, dryRun: false }
```

1. Back up the dataset.
2. Deploy 2.0 and run `migrateAuthNamespace(store)` against each dataset holding auth data, from a one-off script or a deploy step. Users cannot sign in between the deploy and the migration, so run it straight away.
3. Check that `after` is `0`. Running it again is harmless: it reports `before: 0` and changes nothing.

The migration rewrites every IRI starting with the legacy namespace, in subject, predicate and object position, in the default graph and every named graph, in one SPARQL UPDATE request (one transaction on Fuseki). Literals are left alone.

To catch a dataset that was missed, call `hasLegacyAuthData(store)` at boot and warn (or refuse to start) when it returns `true`. It only looks up typed auth records, so it is cheap. `countLegacyAuthTriples(store)` scans the whole dataset.

## Installation

To integrate the Auth package, follow these steps:

1. Wrap your routes with `<ProvideAuth>` component. Define the `userType` and `accountType` and any additional `availableAccountTypes`.

```tsx
import { ProvideAuth } from '@_linked/auth/components/ProvideAuth';
import { Person } from 'profile-plus/shapes/Person';
import { UserAccount } from 'profile-plus/shapes/UserAccount';

<ProvideAuth userType={Person} accountType={UserAccount}>
  <App />
</ProvideAuth>;
```

Configure the same shapes for the backend:

```ini
AUTH_USER_TYPE=profile-plus/shapes/Person
AUTH_ACCOUNT_TYPE=profile-plus/shapes/UserAccount
```

3. Set the secrets. **Outside `NODE_ENV=development` or `test` the server refuses to start without them** (development falls back to insecure defaults and warns).

| Variable | Required | Meaning |
|---|---|---|
| `JWT_SECRET` | yes (outside development/test) | signs access tokens — `openssl rand -base64 48` |
| `SESSION_SECRET` | yes (outside development/test) | signs the session cookie — `openssl rand -base64 48` |
| `SITE_ROOT` | yes | the access token audience |
| `AUTH_ACCESS_TOKEN_TTL` | no | access token lifetime in seconds (default 900; development 3600) |
| `AUTH_REFRESH_TOKEN_TTL` | no | refresh token lifetime in seconds (default 60 days; development 30) |
| `AUTH_SESSION_IDLE_TTL` | no | a session not refreshed for this long ends (default 7 days; `0` = off) |
| `AUTH_SESSION_MAX_TTL` | no | a session ends this long after sign-in (default 60 days; `0` = off) |
| `AUTH_SESSION_CLEANUP` | no | `false` stops the daily background cleanup of old `RefreshToken` records |
| `AUTH_SESSION_CLEANUP_AFTER` | no | how long revoked/expired records are kept before cleanup deletes them (default 30 days) |
| `AUTH_COOKIE_SECURE` | no | `true`/`false` overrides the https detection |
| `AUTH_COOKIE_SAMESITE` | no | `lax`/`strict`/`none` for both token cookies (`none` forces Secure; for a frontend on another site) |
| `AUTH_COOKIE_DOMAIN` | no | cookie domain (default: the host) |
| `AUTH_REFRESH_COOKIE_PATH` | no | path of the refresh cookie (default `/call/@_linked/auth`; prefix it when the app is served under a path) |

Old refresh token records are deleted by `cleanupExpiredSessions(store?, {olderThan})` from `@_linked/auth/utils/sessions`. The backend provider runs it in the background a few minutes after startup and then at most once a day per process; turn that off with `AUTH_SESSION_CLEANUP=false` when a separate job does it.

## How to use on Frontend

Import the useAuth hook in your page to access functions like `signin`, `validateToken`, and `signout`.

Use `useAuth` from application components:

```tsx
import { useAuth } from '@_linked/auth/hooks/useAuth';

const auth = useAuth();
```

Package imports intentionally omit the `.js` suffix. The package export map resolves these paths to compiled ESM output.

## OAuth sign-in

`signinOAuth` accepts `google`, `apple`, or `facebook`. The backend validates the provider credential before resolving or creating an account; caller-supplied profile claims are not accepted as proof of identity.

- Google ID tokens are verified with `google-auth-library` (signature, issuer, expiry, and audience = one of the configured client IDs) and must carry `email_verified`.
- Apple identity tokens are verified against Apple's signing keys (RS256, issuer, audience, expiry). The nonce the client sends must equal the token's `nonce` claim or be the value whose SHA-256 hex digest it is; only the hashed form protects a leaked token against replay.
- Facebook access tokens are checked with `debug_token` using the app token (`is_valid`, `app_id`, `user_id`) before the profile is fetched, and the profile must belong to that user.

### Which account a provider identity reaches

1. A stored subject link for that provider and subject signs straight in.
2. Otherwise, if an account already exists for the email, it is attached only when all of these hold — and every attach writes a subject link:
   - the provider vouches for the email (Google and Apple do; Facebook's Graph API gives no verification flag, so a Facebook email never attaches to an existing account);
   - the account has no password (account creation does not verify email ownership, so a password account may have been registered by somebody else in advance);
   - the account is not already linked to a Facebook identity or to a different identity at the same provider.

   Otherwise sign-in fails with `action: 'sign_in_to_link'`: the user signs in the way they did before and calls `linkOAuthIdentity(provider, payload)` from that session, which links the verified identity to the signed-in account.
3. Otherwise a new account is created without a password.

If identifiers point to more than one account, sign-in fails closed instead of merging them.

Provider configuration uses these environment values:

```ini
DATA_ROOT=...                  # base IRI for subject links
GOOGLE_CLIENT_ID=...           # any of the three Google client IDs may be set
GOOGLE_CLIENT_ID_IOS=...
GOOGLE_CLIENT_ID_ANDROID=...
APP_ID=...                     # Apple audiences: any of these three
APPLE_SIGN_IN_CLIENT_ID=...
APPLE_IOS_BUNDLE_ID=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...
```

Facebook sign-in requires permission to retrieve the user's email address.

Signing out revokes the session on the server, which also clears the auth cookies (native apps: the tokens are removed from storage), so its refresh token can no longer be used. (The access token itself stays valid until it expires — at most 15 minutes by default.)

## Password authentication

Password credentials use a normalized email address. OAuth-only accounts do not receive an implicit password; password sign-in checks that a password credential exists before attempting verification, and an empty or non-string password is refused before any lookup. New and reset passwords must be at least six characters.

Password reset email delivery requires an email provider package configured by the host application.

## Backend request context

Authenticated backend requests expose `request.linkedAuth`. Providers must still reject requests where that context is absent:

```ts
const auth = this.request.linkedAuth;
if (!auth) {
  throw new Error('Authentication required');
}

const user = auth.userAccount.accountOf;
```

## Development sign-in

`DEV_AUTH=true` enables the local development authentication path. It must not be enabled in production. Store-backed sign-in still requires the configured RDF store to be available.

## Build and test

```bash
npx linked build
npm test
```

`npm test` performs a strict TypeScript build and runs the package's Node tests.

## Security notes

- Provider names are runtime-validated even though TypeScript also constrains the public type.
- OAuth account creation uses provider-verified identifiers only.
- Conflicting verified subject and email matches are rejected for manual resolution.
- Authentication logs must not contain tokens, serialized accounts, or personal profile data.
