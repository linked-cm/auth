---
'@_linked/auth': major
---

Auth's ontology moves from `http://lincd.org/ont/auth/` to `https://linked.cm/ont/auth/`, the first-party scheme every public package uses (`https://linked.cm/ont/{publicSlug}/`, next to its shapes at `https://linked.cm/shape/auth/`).

**Breaking — stored auth data must be migrated.** Every auth class and property changed IRI. Credentials, refresh token records and the synced shape descriptions written by 1.x are invisible to this release until they are rewritten: sign-in answers "No password found for this email". Nothing is deleted. Run the migration once per dataset that auth shapes are stored in, right after deploying:

```ts
import { migrateAuthNamespace } from '@_linked/auth/utils/migrateNamespace';
await migrateAuthNamespace(store, { dryRun: true }); // counts only
await migrateAuthNamespace(store); // { before: N, after: 0, dryRun: false }
```

- `migrateAuthNamespace(dataset, {dryRun?})` rewrites every IRI under the legacy namespace (subject, predicate and object, default graph and every named graph) in one SPARQL UPDATE request. Literals are untouched. It is idempotent. `dataset` is any store with `rawQuery` (e.g. `FusekiStore`), not a dataset router.
- `hasLegacyAuthData(dataset)` is a cheap boot-time check for records the migration has not reached; `countLegacyAuthTriples(dataset)` counts everything left.
- The ontology terms (`auth.AuthCredential`, `auth.passwordHash`, …) keep their names; only their IRIs change. Code that hard-codes `http://lincd.org/ont/auth/` in SPARQL must be updated.
- `RefreshToken`: `tokenHash`, `sessionId`, `account`, `createdAt` and `expiresAt` are now required, so creating a record without them is refused instead of storing a token that can never match or expire. The session store reads and writes the records through the typed query DSL without casts.
