---
---

Tests only, no release. The unit and integration tests now run provider calls inside the per-call context that `@_linked/server-utils` 1.9+ reads `provider.request`/`provider.response` from. Assigning `provider.request` outside a call is ignored since then, so the tests that called providers directly saw no request. The published package is unchanged and already works with both server-utils 1.8 and 1.9+.
