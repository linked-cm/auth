---
'@_linked/auth': patch
---

- A missing `JWT_SECRET` / `SESSION_SECRET` outside development/test now throws a `FatalConfigError`
  (`fatal: true`). @_linked/server releases that honour `fatal` abort startup on it instead of
  logging the failed provider hook and serving with broken auth.
- Token responses (every sign-in, `validateToken`, `updateSessionData`) now carry
  `refreshTokenExpiresIn` (seconds) and `refreshTokenExpiresAt` (ISO) for the refresh token they
  return. The client sizes the refresh cookie from them, so it no longer outlives the server's
  record when `AUTH_REFRESH_TOKEN_TTL` is shorter than the client default; the access cookie keeps
  following the JWT `exp`. Without these fields (older servers) the client falls back to its
  defaults, and leaves an unchanged echoed refresh token alone instead of extending it.
  New export `storeAuthTokens` in `utils/token`.
- A non-JWT value presented as an access token (typically the opaque refresh token) is no longer
  logged; other rejected tokens (bad signature, wrong audience or kind) are logged once per token.
