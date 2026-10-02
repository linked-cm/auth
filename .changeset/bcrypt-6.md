---
'@_linked/auth': patch
---

Upgrade bcrypt to 6. It ships prebuilt N-API binaries for linux (glibc and musl, x64/arm64/arm), macOS and Windows inside the package, so installing no longer downloads a binary from GitHub or falls back to a node-gyp compile. Requires Node 18 or newer. Existing password hashes keep verifying — a test pins hashes produced by bcrypt 5 against the built helper.
