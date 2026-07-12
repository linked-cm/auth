---
"@_linked/auth": patch
---

Dev signin now builds the session user as plain identity data (`{ id }`, a QResult) instead of a live `Shape` instance. A live Shape crossed the SSR/JWT serialization boundary and reached the client as an unusable `{__s, u}` reference (undefined `.id`), breaking auth-dependent UI (e.g. the workspace name showing `?`). Also removes the interim `reviveShapeRef` workaround.
