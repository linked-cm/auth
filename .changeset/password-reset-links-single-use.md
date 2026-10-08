---
'@_linked/auth': patch
---

Security: password reset links now expire and work only once.

- A link expires **1 hour** after it is sent. Set `AUTH_PASSWORD_RESET_TTL` (whole seconds) to change that; a value that is not a positive whole number stops the server at startup, like the other `AUTH_*_TTL` settings.
- A link works **once**. `resetPassword` removes the token as soon as it is presented with matching passwords, so a second use fails even if the first one failed later on. Mismatched passwords do not use it up.
- Requesting a new link replaces the previous one, and changing the password while signed in ends any outstanding link.
- Only a SHA-256 hash of the token is stored now (`forgotPasswordToken`), with its expiry in the new `AuthCredential.forgotPasswordTokenExpiresAt` property (`https://linked.cm/ont/auth/forgotPasswordTokenExpiresAt`, `xsd:dateTime`).

**Links sent by earlier releases stop working.** Their tokens were stored without an expiry, so they are treated as expired; users who still have one open need to request a new link. Nothing needs migrating.

`PasswordHelper.validateResetPasswordToken` now also rejects expired tokens, and the new `PasswordHelper.consumeResetPasswordToken` validates and removes a token in one step.

`signinDev` (only with `DEV_AUTH=true`) no longer stores the client-supplied `email` on an account that has none. Only the email claim of the verified access token is stored; the `email` input is ignored.
