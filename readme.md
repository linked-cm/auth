# How to use Auth Package

## Overview

The Auth package facilitates authentication in your application using JSON Web Tokens (JWT). It employs `express-jwt` for stateless authentication, handling `accessToken` and `refreshToken` for web applications via Cookies and mobile applications using `@capacitor/preferences.`

Signing in returns two tokens:

- an **access token** — a JWT (`typ: 'access'`, `aud` = `SITE_ROOT`, `sid` = the session) that authenticates requests as a Bearer header or `accessToken` cookie;
- a **refresh token** — an opaque random value. Only its SHA-256 hash is stored (as a `RefreshToken` shape, through your app's storage — route it like `AuthCredential`). `validateToken` exchanges it for new tokens and **rotates** it: the old one stops working, and presenting it again revokes the session. Signing out revokes the session; a password reset revokes all of the account's sessions.

A refresh token is never accepted as an access token. Apps that verify tokens themselves should use `verifyAccessToken` from `@_linked/auth/utils/jwt` instead of `jwt.verify`.

Default lifetimes: in development the access token lasts 24 hours and the refresh token 30 days; otherwise 10 days and 60 days. The refresh lifetime is sliding (every refresh starts it again).

## Installation

To integrate the Auth package, follow these steps:

1. Wrap your routes with `<ProvideAuth>` component. Define the `userType` and `accountType` and any additional `availableAccountTypes`.

```tsx
import { FreeAccount } from 'lincd-dating/lib/shapes/FreeAccount';
import { Person } from 'lincd-dating/lib/shapes/Person';
import { PaidAccountTier1 } from 'lincd-dating/lib/shapes/PaidAccountTier1';

<ProvideAuth
  userType={Person}
  accountType={FreeAccount}
  availableAccountTypes={[PaidAccountTier1]}
>
  {/* Your application code */}
</ProvideAuth>;
```

2. Set the environment variables `AUTH_ACCOUNT_TYPE` and `AUTH_USER_TYPE` to match the types imported in the `ProvideAuth` component.

```json
"AUTH_ACCOUNT_TYPE": "lincd-dating/lib/shapes/FreeAccount",
"AUTH_USER_TYPE": "lincd-dating/lib/shapes/Person",
```

3. Set the secrets. **Outside `NODE_ENV=development` or `test` the server refuses to start without them** (development falls back to insecure defaults and warns).

| Variable | Required | Meaning |
|---|---|---|
| `JWT_SECRET` | yes (outside development/test) | signs access tokens — `openssl rand -base64 48` |
| `SESSION_SECRET` | yes (outside development/test) | signs the session cookie — `openssl rand -base64 48` |
| `SITE_ROOT` | yes | the access token audience |
| `AUTH_ACCESS_TOKEN_TTL` | no | access token lifetime in seconds |
| `AUTH_REFRESH_TOKEN_TTL` | no | refresh token lifetime in seconds |

## How to use on Frontend

Import the useAuth hook in your page to access functions like `signin`, `validateToken`, and `signout`.

### Get user and userAccount

```tsx
import { useAuth } from 'lincd-auth/lib/hooks/useAuth';
import { FreeAccount } from 'lincd-dating/lib/shapes/FreeAccount';
import { Person } from 'lincd-dating/lib/shapes/Person';

const auth = useAuth<Person, FreeAccount>();
// Person Shapes
const user = auth.user;
// UserAccount Shapes
const userAccount = auth.userAccount;
```

### Signin with OAuth

```tsx
// example OAuth signin method
```

### Sign out

Signing out removes the tokens from cookies/storage and revokes the session on the server, so its refresh token can no longer be used. (The access token itself stays valid until it expires.)

```tsx
import {useAuth} from 'lincd-auth/lib/hooks/useAuth';
import {Person} from 'lincd-dating/lib/shapes/Person';
import {FreeAccount} from 'lincd-dating/lib/shapes/FreeAccount';


const auth = useAuth<Person, FreeAccount>();
<button onClick={() => auth.signout()}>
```

### Validate Token

If you want to redirect the user to specific pages upon authentication, you can use the `validateToken` function.

```tsx
useEffect(() => {
  const validateToken = async () => {
    const validToken = await auth.validateToken();
    if (validToken) {
      // navigate when the token is valid
    } else {
      // navigate to the signin page
    }
  };
  validateToken();
}, []);
```

## How to use on Backend

When a user is authenticated, the request on the server will be updated. This example usage of retrieving user information from the request in the backend.

```tsx
import { BackendProvider } from 'lincd-server-utils/lib/utils/BackendProvider';
import { Person } from 'lincd-dating/lib/shapes/Person';
import { FreeAccount } from 'lincd-dating/lib/shapes/FreeAccount';

export default class SPBackendProvider extends BackendProvider {
  getProfiles() {
    // get linkedAuth from request
    const auth = this.request.linkedAuth;

    // if the user has successfully signed in, "auth" will be available.
    // and if not, return false.
    if (!auth) {
      console.warn('No user authenticated.');
      return false;
    }

    const user = auth.userAccount.accountOf as Person;
    const userAccount = auth.userAccount as FreeAccount;

    // now you can use 'user' and 'userAccount' in your backend logic
    // ...
  }
}
```

## Email configuration

Make sure to install an email client, like `lincd-zeptomail`.
So that emails like 'forgot password' and 'verify email' can be sent from the backend.

## Setup Reset Password

To enable reset password, define a route for the reset password callback component in your app:

```tsx
reset_password_callback: {
  path: '/auth/reset-password',
  component: lazy(
    () =>
      import(
        'lincd-auth/lib/components/ForgotPasswordCallback' /* webpackPrefetch: true */
      ),
  ),
},
```
