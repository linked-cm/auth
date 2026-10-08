---
'@_linked/auth': patch
---

Security: Apple identity tokens are now verified against their audience and issuer. Before, any token signed by Apple was accepted, including one Apple issued to a different app, and its email was signed in.

**Action required if you use Sign in with Apple: set `APPLE_CLIENT_ID`** (the Services ID, for web sign-in) and/or **`APPLE_CLIENT_ID_IOS`** (the app's bundle ID, for native sign-in) on the server. Either may hold several comma-separated IDs. **Without one, Apple sign-in is rejected** (fail closed) and the server logs `No Apple client IDs configured, rejecting Apple sign-in`. This mirrors the existing `GOOGLE_CLIENT_ID*` variables.

Also:

- The token must be RS256, issued by `https://appleid.apple.com`, unexpired, and carry `email_verified: true` when it has an email.
- `signinOAuth('apple', …)` without an `identityToken` is now rejected (`No Apple identity token provided`). Before, it fell through and signed in with the email the client sent.
- An invalid Apple token now returns `{error: 'Invalid Apple identity token'}` instead of throwing.
