---
'@_linked/auth': minor
---

Drop the `foaf` dependency — the last legacy `lincd` package reachable from this tree.

`foaf` was used for types only: no emitted `.js` in `lib/` ever imported it, so the legacy
`lincd` framework copy it pulls in (`lincd`, `lincd-jsonld`, `lincd-rdfs`,
`lincd-design-elems`) was never loaded at runtime — it only sat in the installed tree.

- `src/types/auth.ts` and `src/hooks/useAuth.tsx`: the import (and, in `useAuth`, the
  `type Person` alias) were entirely unused. Removed.
- `src/backend.ts`: `type Person = FoafPerson | SchemaPerson` widened to `Shape`.
- `src/utils/auth.ts`: `Auth.userType` widened from
  `typeof SchemaPerson | typeof FoafPerson` to `typeof Shape`, and the two
  `QResult<SchemaPerson | FoafPerson>` callback positions to `QResult<Shape>`.

All three are widenings, so existing callers keep compiling; `AuthProviderProps.userType`
already used `typeof Shape`, so this makes the two sides agree.
