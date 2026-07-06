# @\_linked/auth

## 1.2.0

### Minor Changes

- [#5](https://github.com/linked-cm/auth/pull/5) [`ed9add7`](https://github.com/linked-cm/auth/commit/ed9add71319bc306be42bae527c5fb2faeef37fc) Thanks [@flyon](https://github.com/flyon)! - **ESM-only.** Dropped the CommonJS build; ships ES modules only (`type: module`, no `require` export condition). Fixed the root `types` field. CJS projects on Node 22+ can `require()` it (sync ESM) or use dynamic `import()`.

### Patch Changes

- [#5](https://github.com/linked-cm/auth/pull/5) [`0f1f502`](https://github.com/linked-cm/auth/commit/0f1f5028e1a36415d98616b7ef9d40f90ad30263) Thanks [@flyon](https://github.com/flyon)! - Migrated all `lincd-sioc` references to `@_linked/sioc` (the new package
  name; sioc was extracted from `lincd.org/modules/` to its own workspace

  - git repo — see the `@_linked/sioc@1.1.0` release notes for the
    package-side story).

  Internal changes (no consumer-facing API change):

  - 10 source files updated: `UserAccount` imports across `backend.ts`,
    `hooks/useAuth.tsx`, `shapes/{AuthCredential, Authentication, IdentityToken,
Password, RefreshToken}.ts`, `types/auth.ts`, `utils/auth.ts`.
  - 3 shape-registration strings updated: `['lincd-sioc', 'UserAccount']` →
    `['@_linked/sioc', 'UserAccount']` in `shapes/{IdentityToken, Password,
RefreshToken}.ts`. The string is the package name stored on the shape
    for dispatch; the new value matches what `linkedPackage('@_linked/sioc')`
    registers.
  - `package.json`: dropped `lincd-sioc: ~1.0`, added `@_linked/sioc: workspace:*`
    (or pin to the published `@_linked/sioc@^1.1` if consuming as a
    published package).

  Consumers should update their own `lincd-sioc` deps to `@_linked/sioc`
  when they upgrade `@_linked/auth` to this version, to avoid having
  both packages installed side-by-side.

  Context: see create-now plan-011 report (docs/reports/009-legacy-lincd-eradication.md).

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
