---
'@_linked/auth': minor
---

Token security: refresh tokens can no longer be used as access tokens, and refresh now actually works.

- **Access tokens are typed.** They carry `typ: 'access'`, `aud` (SITE_ROOT), `sid` (session) and `jti`. Every access check — the request middleware, `verifyToken`, `validateToken` — accepts only access tokens for the right audience. Previously a refresh token (a 60-day JWT) was accepted as a login. Access tokens issued by earlier releases keep working until they expire (they carry `aud`); earlier refresh tokens (no `aud`) are refused.
- **New `verifyAccessToken(token, {audience?})`** in `@_linked/auth/utils/jwt`. Apps that verify tokens themselves should use it instead of `jwt.verify`.
- **Refresh tokens are stored, hashed and rotated.** A refresh token is now an opaque random value; only its SHA-256 hash is stored, as a `RefreshToken` shape (new properties: `tokenHash`, `sessionId`, `createdAt`, `lastUsedAt`, `expiresAt`, `revokedAt`, `replacedBy`; the raw-token `token` property is gone). `validateToken` exchanges it for new tokens and rotates it; presenting a replaced token again revokes the whole session (a 30-second grace covers concurrent tabs). Sign-out revokes the session, a password reset revokes every session of the account, and removing an account deletes its records. The request middleware no longer refreshes.
- **Behaviour change — refresh tokens issued by earlier releases are invalid** (they were never stored, so they cannot be checked). Users sign in again when their current access token expires, which is also what happened before: refresh never succeeded.
- **Behaviour change — the server refuses to start without `JWT_SECRET` and `SESSION_SECRET`** unless `NODE_ENV` is `development` or `test` (an unset NODE_ENV and `staging` count as production). Generate them with `openssl rand -base64 48`. Development keeps the old fallbacks and warns.
- Lifetimes are configurable with `AUTH_ACCESS_TOKEN_TTL` / `AUTH_REFRESH_TOKEN_TTL` (seconds); defaults are unchanged.
- The token verification cache now drops an entry at the token's own expiry (it served expired tokens before) and is bounded.
- Client: cookies get the right lifetime (seconds were passed to js-cookie as days); the access cookie expires with the token; `validateToken` refreshes with the refresh token alone once the access token is gone; `signout` sends the refresh token so the server can revoke the session.
- Removed `RefreshToken.removeRefreshToken` and `RefreshToken.getRefreshTokenForAccount` (they matched on a raw token that was never stored); use `revokeSession`, `revokeAllSessionsForAccount` and `deleteAllSessionsForAccount` from `@_linked/auth/utils/sessions`.
- `removeAccount` deletes the credential, account and person by reference (it passed whole query results to `delete`, which rejected them).
