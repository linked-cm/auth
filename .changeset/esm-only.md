---
"@_linked/auth": minor
---

**ESM-only.** Dropped the CommonJS build; ships ES modules only (`type: module`, no `require` export condition). Fixed the root `types` field. CJS projects on Node 22+ can `require()` it (sync ESM) or use dynamic `import()`.
