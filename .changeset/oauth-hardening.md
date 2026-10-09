---
'@_linked/auth': patch
---

OAuth hardening, ported from PR #32:

- OAuth tokens, payloads and email addresses are no longer written to the log (google-auth-library puts the raw JWT in its error message).
- The session cookie is now `linked.auth`. The old name `@_linked/auth` is not a legal cookie name, so any request that wrote `req.session` never finished.
- Removing an account removes every credential and identity token of it; `onAccountWillBeRemoved` listeners are awaited and the subscription can be removed. With duplicate credential rows, the one with a password hash is used.
- OAuth users are signed in by the provider's subject. A sign-in whose email matches an account that has a password (or another link at that provider) is no longer attached automatically: `signinOAuth` returns `{error, action: 'sign_in_to_link'}`, and the user links the provider after signing in with `linkOAuthIdentity`. This closes pre-account hijacking (an attacker creating a password account with someone's email before they first use Google or Apple). Raw identity tokens are no longer stored. `useAuth().signinOAuth` returns `{error, action}`.
- Apple sign-in can carry a server-issued, single-use nonce from `createOAuthNonce`. `AUTH_APPLE_NONCE=optional` (default) checks it when present; `required` refuses tokens without one.

Apps with an RPC exposure list should declare `linkOAuthIdentity: 'user'`, `createOAuthNonce: 'public'` and `userHasPassword: 'user'`.
