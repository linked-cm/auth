---
'@_linked/auth': minor
---

Depend on `@_linked/react@^2.0.0` (was `^1.1.0`), and on the first releases of its linked dependencies that use it: `@_linked/primitives@^1.8.0`, `@_linked/schema@^1.5.0` and `@_linked/sioc@^1.4.0`. `@_linked/core` moves to `^2.27.0`, the core peer range `@_linked/react` 2 requires.

An app on `@_linked/react` 2 no longer installs a second copy of `@_linked/react` 1 through this package. The APIs used from it — `createLinkedComponentFn`, `useStyles`, `cl` and `useQueryContext` — kept their signatures. `useQueryContext` (used by `AuthProvider` for the `user` and `userAccount` contexts) now also clears its context when `AuthProvider` unmounts, and no longer re-sets it when a new object with the same id is passed.

Minor rather than major: `@_linked/react` is a regular dependency here, not a peer, so no consumer has to change anything to install this release.
