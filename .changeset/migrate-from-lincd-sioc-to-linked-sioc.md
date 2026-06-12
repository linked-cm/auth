---
'@_linked/auth': patch
---

Migrated all `lincd-sioc` references to `@_linked/sioc` (the new package
name; sioc was extracted from `lincd.org/modules/` to its own workspace
+ git repo — see the `@_linked/sioc@1.1.0` release notes for the
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
