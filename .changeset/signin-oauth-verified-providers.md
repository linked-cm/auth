---
'@_linked/auth': patch
---

Security: `signinOAuth` now only accepts providers whose token the server verifies itself, which are `google` and `apple`. Any other provider, including a missing or unknown one, returns `{error: 'Unsupported OAuth provider'}` and is logged.

**Facebook sign-in via `signinOAuth` is no longer accepted** until proper Facebook token verification lands. It trusted the email the client sent, without checking it against Facebook, and signed in the account that owns that email. Apps that call `signinOAuth('facebook', …)` now get the error above.

The email that is signed in now always comes from the verified Google or Apple token. An `email` field sent by the client is ignored.
