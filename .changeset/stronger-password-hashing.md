---
"@_linked/auth": patch
---

Security: stronger password hashing, and changing a password while signed in now needs the current password.

- **New password hashes use bcrypt cost 10** (`PASSWORD_HASH_COST`, exported from `helpers/password`). Before, the cost was 3, which bcrypt raises to its minimum of 4. This applies to `createAccount`, `resetPassword` and `AuthCredential.createNewCredential`. A hash now takes roughly 80 ms on the server.
- **Existing hashes upgrade on the next sign-in.** After `signinWithPassword` verifies a password whose stored hash has a lower cost, it re-hashes it at cost 10 and stores it, writing only `passwordHash`. If that write fails the sign-in still succeeds; the failure is logged and the next sign-in tries again. Nothing needs migrating. New `PasswordHelper.needsRehash(hash)`.
- **`resetPassword` without a reset token now requires the current password**, as a new fourth argument: `resetPassword(password, confirmPassword, token, currentPassword)`. It is verified against the stored hash. Without it the call returns `{error: 'Your current password is required to change your password'}`, and with a wrong one `{error: 'Your current password is incorrect'}`. Before, a signed-in session alone could change the password.
- An account that has **no password yet** (e.g. OAuth only) can no longer get one through `resetPassword` without a token. It returns `{error, action: 'reset_password_by_email'}`; the reset email is the way to set one.
- The reset link path (with a token) is unchanged: no current password, single-use, expiring.
- `CreateNewPasswordForm` (and so `EditPasswordButton`) asks for the current password when it has no `token`, and now shows the server's error instead of ignoring it.

**Apps with their own change-password UI** that call `resetPassword` without a token must send the current password as the fourth argument, or the change is refused.

The npm package now ships only `lib/`, `readme.md`, `CHANGELOG.md` and `package.json` (a `files` list). `.github/`, `.changeset/`, `docs/`, `renovate.json`, `.gitattributes` and the `tsconfig-*.json` files are no longer in the tarball.
