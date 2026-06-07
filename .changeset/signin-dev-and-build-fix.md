---
"@_linked/auth": minor
---

- `feat(webid)`: UUID v5 derivation with public namespace; restore `telephoneToWebID` with dedicated phone namespace
- `fix(backend)`: use `UserAccount.email` lookup instead of `webIDToEmail(user.id)`
- `feat(signin-dev)`: `AuthBackendProvider.signinDev` + `useAuth.signinDev` hook
- `fix(signin-dev)`: tolerate boolean `true` in `DEV_AUTH` env var; select a real decorated property when looking up Person
- `fix(build)`: switch to explicit per-step build pipeline so silent build failures no longer ship empty tarballs
