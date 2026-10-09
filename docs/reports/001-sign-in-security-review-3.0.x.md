---
date: 2026-10-09
summary: >
  Why @_linked/auth went from 3.0.0 to 3.0.6 in a week. A review of the sign-in paths found
  Apple identity tokens accepted for any app, Facebook sign-in trusting a client-supplied email,
  password reset links that never expired, a bcrypt cost of 4 and a password change that did not
  ask for the current password. Each was fixed in its own patch release. 3.0.6 stops the server
  dispatching auth's internal provider methods over HTTP and fixes the `types` entry. Lists the
  open items (Apple nonce, matching accounts by email, no rate limit) and what consumers must
  configure.
---

# 001 — Sign-in security review, 3.0.1 to 3.0.6

This report is for whoever maintains `@_linked/auth` next. It records why a run of patch
releases happened, what each one found, and what was decided, including what was deliberately
left open. The CHANGELOG says what changed; this says why.

The work was part of a wider dependency and checkout maintenance effort across the `linked-fw`
packages. Create Now keeps the sibling report for it ("Dependency and checkout maintenance",
report 074 in the Create Now repository's `docs/reports/`), which covers the Renovate backlog
and the test breakage described under *Also in this period*.

## How the fixes were shipped

Each fix was released on its own so a consumer could take them one at a time. Each is a patch:
none changes an API a consumer calls, though several make a request that used to succeed fail.
(3.0.5, #87, only declared the `react` peer dependency and is not part of this review.)

## What was found and fixed

### 3.0.1 (linked-fw/auth#79): Apple tokens were accepted for any app

`jwt.verify(identityToken, publicKey)` was called with no options. The signature was checked,
but not who the token was for, so a genuine Apple identity token issued to **any** app signed in
here.

Now the verification pins `algorithms: ['RS256']`, `issuer: 'https://appleid.apple.com'` and an
`audience` read from `APPLE_CLIENT_ID` (the Services ID, used on the web) and
`APPLE_CLIENT_ID_IOS` (the app's bundle ID). Each may be a comma-separated list. **It fails
closed:** with neither variable set, every Apple sign-in is refused. `email_verified` is
enforced, and the helper returns `null` rather than throwing, so a bad token is a refused
sign-in rather than a 500.

### 3.0.2 (#81): Facebook sign-in trusted the client's email

`signinOAuth` verified Google and Apple tokens, but had no verification branch for Facebook. The
email the client sent went straight to `Auth.login`, so anyone could sign in as any account by
naming its email. Consumers expose `signinOAuth` publicly (it has to run before there is a
session), so this was reachable by anyone.

Decision: only providers in `VERIFIED_OAUTH_PROVIDERS = ['google', 'apple']` are accepted, and
the email is taken only from the verified token, never from the request. Facebook stays off
until it has real token verification. That is the scope of the open PR #32.

### 3.0.3 (#83): password reset links never expired

A reset link worked forever and could be used more than once, and the raw token was stored, so
anyone who could read the store could reset any password with an outstanding link.

Now a link is single-use (the token is consumed when used, valid or not), expires after
`AUTH_PASSWORD_RESET_TTL` seconds (default 3600), and only its SHA-256 hash is stored. Tokens
stored by earlier releases have no expiry recorded and are treated as expired. Changing the
password while signed in clears any outstanding link. The expiry is a new ontology term,
`forgotPasswordTokenExpiresAt`; it is additive, like `sessionStartedAt`, so no migration is
needed.

In the same release `signinDev` stopped storing an email supplied by the client.

### 3.0.4 (#85): weak password hashing, password change without the current password

- **bcrypt cost raised from 3 to 10** (`PASSWORD_HASH_COST`). bcrypt clamps 3 to its minimum of
  4, so every stored hash is cost 4. Measured on an M1 Pro with native bcrypt 6: cost 4 takes
  about 1.4 ms per hash, cost 10 about 86 ms. 10 is the usual default and still cheap for a
  sign-in.
- **Stored hashes are upgraded on sign-in.** After a successful password check, a hash with
  `getRounds < 10` is replaced by a cost-10 hash of the password just verified. A failure there
  is logged and never blocks the sign-in; the next sign-in tries again. There is no other way to
  upgrade a bcrypt hash, since the password is only known at sign-in.
- **Changing a password without a reset token now requires `currentPassword`.** Before, a
  signed-in session alone was enough, so a stolen session could take over the account for good.
  In the UI the no-token path is `EditPasswordButton` → `CreateNewPasswordForm`; the email path
  carries the reset token and does not ask. An account with no password yet (OAuth only) is
  sent to the email flow instead.
- **A `files` list was added to package.json**, so the tarball carries only `lib`, the readme
  and the CHANGELOG (132 files → 121).

### 3.0.6 (this release): internal provider methods, and `types`

**Provider methods the server must never dispatch.** 3.0.4 added `upgradePasswordHash(credential,
plainPassword)` to the backend provider for the re-hash above. It is only called from
`signinWithPassword`, after the password check. But every instance method of a backend provider
is reachable over `/call/@_linked/auth/<method>` unless something says otherwise, and in the
server's default `warn` exposure mode an undeclared method runs. TypeScript's `protected` does
nothing at runtime. So anyone could have called it with any credential id and set that
credential's password. Create Now caught this with its exposure test, which blocks it on its own
side, but other consumers had no such list.

`@_linked/server-utils` 1.9 added the mechanism for this: `declareInternal(cls, methods)` (or the
`@internal()` decorator) in `@_linked/server-utils/utils/callable`. The server answers 501 for
an internal method in every exposure mode, the declaration is inherited by subclasses (an
app's override stays internal), and backend-to-backend calls are not affected. auth now declares
its own internal methods at the bottom of `backend.ts` and `shapes/AuthCredentialProvider.ts`,
and requires `@_linked/server-utils` `^1.9.0` (it was `^1.8.0`, which did not have the module).

The rule used to choose them: a method that acts on a credential, person or account named by
its arguments, with no check of who is asking, and that no frontend calls.

| Provider | Method | Exposed, it would |
|---|---|---|
| `AuthBackendProvider` | `upgradePasswordHash` | set any credential's password |
| `AuthBackendProvider` | `getPasswordForUser` | return any person's password hash |
| `AuthBackendProvider` | `getOrCreateAccount` | create an account for any WebID |
| `AuthBackendProvider` | `loadAccountForSession` | return any account's email |
| `AuthBackendProvider` | `loadUserForSession` | return any person's name and phone number |
| `AuthCredentialProvider` | `createNewCredential` | add a password to any person |

`resetPassword` reaches `createNewCredential` through `AuthCredential.createNewCredential`, a
backend-to-backend `Server.call`, which keeps working. `test/exposure.test.mjs` checks these
declarations, and that the methods auth's frontend calls are not internal.

Left undeclared on purpose:

- `hasAuthCredential` tells whether any person has a password. It is an account-enumeration leak
  rather than a takeover, and `AuthCredential.hasAuthCredential` is a client-side wrapper for it,
  so a consumer may call it from a browser. It should probably become internal, with callers
  moved to `userHasAuthCredential` (which answers for the signed-in user only).
- `checkSignin`, `validateRequestToken`, `refreshSession`, `getTokenFromRequest`,
  `getTokenCandidates` and `getRefreshTokenFromRequest` act on the caller's own request or
  tokens. Reachable, they give a caller nothing it does not already have. A consumer may still
  declare them internal (Create Now does).
- auth does not yet declare its **callable** methods (`declareCallable` / `@callable`). Until it
  does, a server in `enforce` mode answers 501 for sign-in unless the app declares them, as
  Create Now does.

**`types`.** package.json had `"types": "index.d.ts"`, a file that has never been in the
tarball. It now points at `lib/esm/index.d.ts`, the same file the `exports` map's `types`
condition uses. Only tools that ignore `exports` read this field.

## Also in this period

- #78 fixed the tests for server-utils ≥ 1.9, which reads `provider.request` and `response`
  from a per-call request context, so assigning them in a test stopped working. The
  `test/serving.mjs` helper runs a test's calls inside a request context. This unblocked the
  lockfile maintenance PR #77.
- google-auth-library 11 (#74) and jwks-rsa 4 (#76) were checked to behave identically to the
  versions they replaced: 16 Google and 12 Apple checks, including a real Google ID token from
  the OAuth Playground.
- **google-auth-library 11 requires Node ≥ 22.**

## Known open items

- **No Apple nonce**, so an Apple identity token can be replayed while it is valid. PR #32 adds
  one.
- **Accounts are matched by email, not by the provider's `sub`.** An identity provider that lets
  a user change their email, or reissues one, can move a sign-in to another account.
- **The raw identity token is stored** in `IdentityToken`.
- **`signinDev` accepts any WebID when the token has no `sub`.** It is dev-only and left as is
  on purpose.
- **No rate limit on password attempts.** The higher bcrypt cost slows a guessing attack but
  does not stop one.
- **Single-use reset is not atomic.** The store has no compare-and-swap, so two requests racing
  with the same token can both succeed.
- **Open PR #32 rewrites the Apple and Facebook code with different environment variable
  names** (`APPLE_SIGN_IN_CLIENT_ID`, `APPLE_IOS_BUNDLE_ID`, `APP_ID`). When it is rebased it
  must adopt `APPLE_CLIENT_ID` / `APPLE_CLIENT_ID_IOS`, or every deployment that set them for
  3.0.1 will refuse Apple sign-in again.

## For consumers

- **Set `APPLE_CLIENT_ID` (web) and/or `APPLE_CLIENT_ID_IOS` (iOS) wherever Apple sign-in is
  used.** Without them, from 3.0.1 on, every Apple sign-in fails. The PeaceGame data shows Apple
  users; Create Now does not use Apple sign-in.
- **Facebook sign-in is refused** from 3.0.2 until PR #32 lands.
- **A password change form must send the current password** from 3.0.4 on, unless it carries a
  reset token.
- **On 3.0.4 or 3.0.5, an app with an RPC exposure list should list `upgradePasswordHash` as
  internal.** From 3.0.6 on, auth declares it (and the others above) itself; an app's own
  declaration of the same method is harmless.
- **3.0.6 needs `@_linked/server-utils` 1.9 or later.** An app pinned to 1.8 would get a second
  copy of server-utils.
