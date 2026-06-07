# @\_linked/auth

## 1.1.0

### Minor Changes

- [#2](https://github.com/linked-cm/auth/pull/2) [`7c8d701`](https://github.com/linked-cm/auth/commit/7c8d701c8da685a54ebf88ee5dab1a8ee0537576) Thanks [@flyon](https://github.com/flyon)! - - `feat(webid)`: UUID v5 derivation with public namespace; restore `telephoneToWebID` with dedicated phone namespace
  - `fix(backend)`: use `UserAccount.email` lookup instead of `webIDToEmail(user.id)`
  - `feat(signin-dev)`: `AuthBackendProvider.signinDev` + `useAuth.signinDev` hook
  - `fix(signin-dev)`: tolerate boolean `true` in `DEV_AUTH` env var; select a real decorated property when looking up Person
  - `fix(build)`: switch to explicit per-step build pipeline so silent build failures no longer ship empty tarballs

## 1.0.6

### Patch Changes

- [`9c5b6aa`](https://github.com/linked-cm/auth/commit/9c5b6aac3c5b497077bdbf687132e489cfd3ada3) - Initial release under the new publishing setup.
