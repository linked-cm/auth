---
'@_linked/auth': minor
---

Rename `IdentityToken.subject` to `IdentityToken.sub`.

`subject` is a field of the query builder, so `IdentityToken.select(t => [t.subject])` and
`.where(t => t.subject.equals(...))` resolved to that field instead of the property and failed.
This broke `getTokenByEmailOrSubject`, `getTokenByAccount` and `hasToken`.

The RDF predicate is unchanged (`auth:subject`), so stored tokens need no migration. Update
any code that reads `token.subject` from query results or passes `subject` to
`IdentityToken.create`/`update` to use `sub`.
