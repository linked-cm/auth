---
"@_linked/auth": patch
---

The server no longer dispatches auth's internal provider methods over HTTP. `upgradePasswordHash` (added in 3.0.4), `getPasswordForUser`, `getOrCreateAccount`, `loadAccountForSession` and `loadUserForSession` on the backend provider, and `createNewCredential` on `AuthCredentialProvider`, are declared with `declareInternal` from `@_linked/server-utils/utils/callable`, so `/call/@_linked/auth/...` answers 501 for them in every `rpcExposure` mode. Before, in the default `warn` mode, anyone could call them, for example to set any credential's password. Calls from backend code are unaffected. Requires `@_linked/server-utils` `^1.9.0` (was `^1.8.0`).

package.json `types` now points at `lib/esm/index.d.ts`. It pointed at `index.d.ts`, which is not in the package.
