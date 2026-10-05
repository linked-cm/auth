import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import type { Shape } from '@_linked/core/shapes/Shape';
import { UserAccount } from '@_linked/sioc/shapes/UserAccount';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
import session from 'express-session';

import { Auth } from './utils/auth.js';
import { SendMailClient } from 'zeptomail';
import { AuthCredential } from './shapes/AuthCredential.js';
import { auth } from './ontologies/auth.js';
import { expressjwt, Request } from 'express-jwt';
import cookieParser from 'cookie-parser';
import type {
  AuthSessionPayload,
  AuthenticationResult,
  AppleOAuthPayload,
  CreateAccount,
  FacebookOAuthPayload,
  GoogleOAuthPayload,
  OAuthProvider,
  OAuthPayloadMap,
  OAuthProfilePayload,
  UserAccountData,
  UserData,
  VerifiedOAuthIdentity,
} from './types/auth.js';
import { isOAuthProvider } from './types/auth.js';
import {
  createAccessToken,
  verifyAccessToken,
  verifyToken,
} from './utils/jwt.js';
import {
  deleteAllSessionsForAccount,
  findRefreshTokenExpiry,
  findSessionIdForRefreshToken,
  revokeAllSessionsForAccount,
  revokeSession,
  rotateRefreshToken,
  startSessionCleanup,
  stopSessionCleanup,
} from './utils/sessions.js';
import { clearAuthCookies, deliverTokens } from './utils/cookies.js';
import { assertAuthSecrets } from './utils/secrets.js';
import { refreshTokenExpiryFields } from './utils/token.js';
import {
  emitAccountWillBeRemovedEvent,
  onAccountWillBeRemoved,
} from './utils/events.js';
import AppleHelper, { buildAppleTokenAudiences } from './helpers/apple.js';
import FacebookHelper from './helpers/facebook.js';
import GoogleHelper from './helpers/google.js';
import {
  decideEmailMatchedAccount,
  resolveOAuthAccountInput,
  resolveVerifiedEmailAccount,
} from './helpers/oauth-account.js';
import {
  buildOAuthSubjectLinkId,
  providerOfSubjectLink,
} from './helpers/oauth-subject-link.js';
import PasswordHelper from './helpers/password.js';
import { IdentityToken } from './shapes/IdentityToken.js';
import path, { dirname, basename } from 'path';
import { LinkedEmail } from '@_linked/server-utils/utils/LinkedEmail';
import { QResult } from '@_linked/core/queries/SelectQuery';
import type { AuthSession } from './types/auth.js';

import connect_sqlite3 from 'connect-sqlite3';
import { emailToWebID } from './utils/webID.js';
import { isCleanName } from './utils/name-validation.js';
import {
  isAcceptableNewPassword,
  isCheckablePassword,
  MIN_PASSWORD_LENGTH,
} from './utils/password-policy.js';

var SQLiteStore = connect_sqlite3(session);

declare var process;
// The configured user shape (`Auth.userType`). Historically `SchemaPerson | FoafPerson`;
// `foaf` was the last legacy `lincd` package in this dependency tree and the
// union was type-only, so this widens to the same `typeof Shape` that
// `AuthProviderProps.userType` already used.
type Person = Shape;

export * from './shapes/AuthCredentialProvider.js';

const filename__ =
  typeof __filename !== 'undefined'
    ? __filename
    : //@ts-ignore
      basename(import.meta.url).replace('file:/', '');

// OAuth helpers live outside the provider class on purpose: every method of a
// backend provider can be invoked over RPC (`/call/<package>/<method>`), and
// none of these may be reachable from a client.

/**
 * Verify a provider credential on the server and return only what the
 * provider vouches for. Profile fields the client sent are never used for
 * identity; the only client value kept is Apple's name, which Apple hands to
 * the client (once) instead of putting it in the token.
 */
async function verifyOAuthIdentity(
  provider: OAuthProvider,
  oauthUserData: unknown
): Promise<VerifiedOAuthIdentity | { error: string }> {
  const data = (oauthUserData || {}) as Record<string, any>;

  if (provider === 'apple') {
    try {
      const apple = await AppleHelper.validateIdentityToken(
        (data as AppleOAuthPayload).identityToken,
        {
          nonce: (data as AppleOAuthPayload).nonce,
          audiences: buildAppleTokenAudiences(
            process.env.APP_ID,
            process.env.APPLE_SIGN_IN_CLIENT_ID,
            process.env.APPLE_IOS_BUNDLE_ID
          ),
        }
      );
      const profile = data as OAuthProfilePayload;
      return {
        provider,
        subject: apple.sub,
        email: apple.email,
        emailVerified: apple.emailVerified,
        givenName:
          typeof profile.givenName === 'string' ? profile.givenName : undefined,
        familyName:
          typeof profile.familyName === 'string'
            ? profile.familyName
            : undefined,
      };
    } catch (error) {
      console.error('Apple OAuth validation failed');
      return { error: 'Invalid Apple identity token' };
    }
  }

  if (provider === 'google') {
    const idToken = (data as GoogleOAuthPayload).authentication?.idToken;
    if (!idToken) {
      console.error('Google OAuth: No ID token provided');
      return { error: 'No Google ID token provided' };
    }
    const google = await GoogleHelper.validateIdToken(idToken);
    if (!google) {
      console.error('Google OAuth: Invalid ID token');
      return { error: 'Invalid Google ID token' };
    }
    return {
      provider,
      subject: google.sub,
      email: google.email,
      emailVerified: google.email_verified === true,
      givenName: google.given_name,
      familyName: google.family_name,
    };
  }

  try {
    const facebook = await FacebookHelper.validateAccessToken(
      (data as FacebookOAuthPayload).accessToken
    );
    return {
      provider,
      subject: facebook.id,
      email: facebook.email,
      // The Graph API gives no verification flag for the email.
      emailVerified: false,
      givenName: facebook.givenName,
      familyName: facebook.familyName,
    };
  } catch (error) {
    console.error('Facebook OAuth validation failed');
    return { error: 'Invalid Facebook access token' };
  }
}

type SubjectLinkRow = {
  id: string;
  sub?: string;
  email?: string;
  account?: UserAccountData;
};

/**
 * Subject links for one provider identity: the deterministic link, plus (for
 * Apple) links made before links had deterministic IRIs.
 */
async function findSubjectLinks(
  provider: OAuthProvider,
  subject: string
): Promise<SubjectLinkRow[]> {
  const linkId = buildOAuthSubjectLinkId(
    process.env.DATA_ROOT,
    provider,
    subject
  );
  const rows: SubjectLinkRow[] = [];
  const direct = await IdentityToken.select((token) => [
    token.email,
    token.sub,
    token.account.select((account) => [account.email, account.accountOf]),
  ]).for(linkId);
  if (direct) rows.push(direct as SubjectLinkRow);

  if (provider === 'apple') {
    const legacy = await IdentityToken.getTokensBySubject(subject);
    rows.push(
      ...(legacy as SubjectLinkRow[]).filter(
        (link) => providerOfSubjectLink(link) === 'apple'
      )
    );
  }
  return rows.filter((link) => link.account?.id);
}

async function linkedProvidersOfAccount(
  accountId: string
): Promise<OAuthProvider[]> {
  const links = await IdentityToken.select((token) => [token.sub]).where(
    (token) => token.account.equals({ id: accountId } as any)
  );
  return [
    ...new Set(
      (links as SubjectLinkRow[])
        .map((link) => providerOfSubjectLink(link))
        .filter((provider): provider is OAuthProvider => Boolean(provider))
    ),
  ];
}

async function personHasPassword(personId: string): Promise<boolean> {
  const credentials = await AuthCredential.select((cred) => [
    cred.passwordHash,
  ]).where((cred) => cred.credentialOf.equals({ id: personId }));
  return credentials.some((credential) => Boolean(credential.passwordHash));
}

async function createSubjectLink(
  identity: VerifiedOAuthIdentity,
  email: string | undefined,
  account: { id: string }
) {
  await IdentityToken.create({
    __id: buildOAuthSubjectLinkId(
      process.env.DATA_ROOT,
      identity.provider,
      identity.subject
    ),
    ...(email ? { email } : {}),
    sub: identity.subject,
    account: { id: account.id },
  } as any);
}

export default class AuthBackendProvider extends BackendProvider {
  public accountShape: typeof UserAccount = UserAccount;
  public userShape: typeof SchemaPerson = SchemaPerson;
  protected zeptoMail: SendMailClient;
  // Plan-011 — store the unsubscribe function so dispose() can detach the
  // listener without having to keep the original callback reference around.
  private unsubscribeAccountRemoval?: () => void;

  async setupBeforeControllers() {
    // Fail at startup, not on the first sign-in, when a production deployment lacks its secrets.
    // This is the first thing the package runs at boot. The error is a FatalConfigError
    // (`fatal: true`), which @_linked/server re-throws to abort startup instead of logging the
    // failed hook and serving with broken auth.
    const { jwtSecret, sessionSecret } = assertAuthSecrets(filename__);

    //if defined, take the values from the environment variables to define the shapes for the account and user
    await this.assignEnvPathToField('AUTH_ACCOUNT_TYPE', 'accountShape');
    await this.assignEnvPathToField('AUTH_USER_TYPE', 'userShape');

    this.unsubscribeAccountRemoval = onAccountWillBeRemoved(
      async (account: UserAccountData) => {
        try {
          // Refresh-token rows are session records now, so removal goes through the
          // session store. IdentityToken is defined here in Auth, so its cleanup
          // belongs in this listener rather than in a dependent package.
          await Promise.all([
            deleteAllSessionsForAccount(account?.id),
            IdentityToken.deleteWhere((token) => token.account.equals(account)),
          ]);
        } catch (err) {
          console.error('Could not delete the sessions of a removed account', err);
        }
      }
    );

    // Delete long-revoked/expired refresh token records in the background (at most daily per
    // process; AUTH_SESSION_CLEANUP=false turns it off).
    startSessionCleanup();

    // set the user and account shapes for auth
    Auth.userType = this.userShape;
    Auth.accountType = this.accountShape;

    // set zeptoMail client
    this.zeptoMail = new SendMailClient({
      url: 'api.zeptomail.com/',
      token: process.env.ZEPTOMAIL_TOKEN,
    });

    // FOR initial page requests we send the JWT token as a cookie (Stored in the browser)
    // see getToken for how we use the cookie and set this.request.linkedAuth
    // registerRoute tracks these so dispose() can remove them on HMR.
    this.registerRoute('use', '/', cookieParser());

    // For API requests, we send a token as the Bearer header
    // It gets parsed by this middleware and the result is that
    // on getToken we catch first every request and check the headers or cookies
    // and if has, we set into this.request.linkedAuth
    this.registerRoute(
      'use',
      '/',
      expressjwt({
        secret: jwtSecret,
        algorithms: ['HS256'],
        // getToken below only hands over verified access tokens; this repeats the audience check
        // for the verification express-jwt does itself.
        ...(process.env.SITE_ROOT ? { audience: process.env.SITE_ROOT } : {}),
        credentialsRequired: false, // allows unauthenticated requests to pass through
        getToken: async (
          req: Request & { auth: AuthSessionPayload } & {
            linkedAuth: AuthSession;
          }
        ): Promise<string> => {
          return this.validateRequestToken(req);
        },
        // An expired access token leaves the request anonymous (req.auth stays undefined).
        // It is NOT refreshed here: a token minted in middleware never reaches the client, and
        // rotating the refresh token without delivering the new one would make the client's next
        // refresh look like token theft. Clients refresh through the validateToken RPC.
        onExpired: async () => {},
      }).unless({
        // Skip token verification for all static assets
        path: [
          /^\/public\/.*/, // anything under /public
          /^\/uploads\/.*/, // anything under /uploads
          /^\/resized\/.*/, // dynamically‑resized images
          /^\/favicon\.ico$/, // favicon
          /^\/\.well-known\/.*/, // ACME challenges etc.
        ],
      })
    );

    this.registerRoute(
      'use',
      '/',
      session({
        secret: sessionSecret,
        name: '@_linked/auth',
        //TODO: this broke sessions in production, need to check what else we need to do to make secure sessions work
        // cookie: {secure: process.env.NODE_ENV === 'production'},
        resave: true,
        saveUninitialized: false,
        store: new SQLiteStore({
          dir: path.join(process.cwd(), 'data'),
        }),
      })
    );
  }

  async dispose() {
    // Plan-011 — remove the middleware we tracked above + unsubscribe
    // the account-removed listener so HMR doesn't leak handlers.
    this.disposeRoutes();
    stopSessionCleanup();
    this.unsubscribeAccountRemoval?.();
    this.unsubscribeAccountRemoval = undefined;
  }

  /**
   * Authenticate an incoming request from its access token (Bearer header or `accessToken`
   * cookie). Only a valid access token counts; refresh tokens are never accepted here.
   *
   * @returns the access token if it is valid, otherwise null
   */
  async validateRequestToken(request, _accessTokenExpired: boolean = false) {
    // the Bearer header first, then the `accessToken` cookie (see getTokenCandidates)
    for (const token of this.getTokenCandidates(request)) {
      const verificationResult = await verifyToken({
        request,
        token,
        provider: this,
      });

      // if token is valid, set the authentication object
      if (verificationResult) {
        let authentication = await Auth.setAuthentication(
          request as any,
          verificationResult.payload
        );

        if (!authentication) {
          console.log(`GET TOKEN authentication: no authentication`);
          return null;
        }

        return verificationResult.accessToken;
      }
    }

    return null;
  }

  /**
   * Initialize the incoming request
   *
   * @param request - The incoming request
   * @param response - The outgoing response
   */
  async initRequest(request, response) {
    super.initRequest(request, response);
  }

  // TODO: check possible to remove this method?
  checkSignin() {
    //this is a temporary fix that allows the frontend to check if the user is still logged in on the backend
    return this.request.linkedAuth?.userAccount;
  }

  /**
   * Supply data for the incoming request
   * This data will then be available on the frontend right upon initialisation
   *
   * @param request - The incoming request
   * @param response - The outgoing response
   * @param dataQuads - The set of data quads to be populated
   */
  async supplyDataForRequest(request, response, dataQuads: any): Promise<void> {
    //if logged in and we're collecting frontend data
    if (request.linkedAuth && request.frontendData) {
      const requestAuth = { ...request.linkedAuth };
      //Remove things that should not go to the frontend
      delete requestAuth.updateSessionData;
      //Store in the object that will be sent to the frontend
      request.frontendData.auth = requestAuth;
    }
  }

  /**
   * Sign in with email and password
   *
   * @param email - The email address
   * @param plainPassword - The plain password
   * @returns
   */
  async signinWithPassword(
    email: string,
    plainPassword: string
  ): Promise<AuthenticationResult> {
    if (!isCheckablePassword(plainPassword)) {
      return {
        error: 'Invalid email / password combination',
      };
    }
    if (typeof email !== 'string') {
      return { error: 'Invalid email format' };
    }

    let webID: string;
    try {
      webID = emailToWebID(email);
    } catch (error) {
      console.error('Invalid email format during signin', error);
      return {
        error: 'Invalid email format',
      };
    }

    // find any passwords for accounts with this email
    // and select the hash and account/person details
    let existingCredential = await this.getPasswordForUser({ id: webID });

    if (!existingCredential) {
      console.warn(
        `Could not find any password associated with this email: ${email}, so we will check by user email`
      );

      // we get the user by email, if catch the user from here
      // we can say the user signup with temporary signin
      const account = await UserAccount.select((ua) => {
        return [ua.email, ua.accountOf];
      })
        .where((ua) => {
          return ua.email.equals(email);
        })
        .one();

      if (!account) {
        return {
          error: 'This email is not registered',
        };
      }

      const accountCredentials = await AuthCredential.select((ac) => {
        return [
          ac.passwordHash,
          ac.credentialOf.select((p) => {
            return [p.givenName, p.familyName, p.telephone];
          }),
        ];
      }).where((ac) => {
        return ac.credentialOf.equals({ id: account.accountOf.id });
      });

      // OAuth and legacy flows can leave more than one credential row on a
      // person. Select the row that actually contains a password hash.
      existingCredential = accountCredentials.find((credential) =>
        Boolean(credential.passwordHash)
      );

      if (!existingCredential) {
        return {
          error: 'No password found for this email',
        };
      }
    }

    const passwordIsValid = await PasswordHelper.checkPassword(
      plainPassword,
      existingCredential.passwordHash
    );

    if (!passwordIsValid) {
      return {
        error: 'Invalid email / password combination',
      };
    }

    const person = existingCredential.credentialOf;

    const account = await this.getOrCreateAccount(person);

    return Auth.onSigninSuccessful(this, person, account);
  }

  /**
   * Create a new account
   *
   * @param CreateAccount - The account data to create
   * @returns
   */
  async createAccount({
    firstName,
    lastName,
    email,
    password,
  }: CreateAccount): Promise<AuthenticationResult> {
    // check if the first name and email are provided
    if (
      !firstName ||
      !email ||
      typeof firstName !== 'string' ||
      typeof email !== 'string' ||
      (lastName != null && typeof lastName !== 'string')
    ) {
      return {
        error: 'No first name or email are provided',
      };
    }

    if (!isAcceptableNewPassword(password)) {
      return {
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    if (!isCleanName(firstName) || (lastName && !isCleanName(lastName))) {
      return {
        error: 'Please enter your real name.',
      };
    }

    email = email.trim().toLowerCase();

    let webIDFromEmail: string;
    try {
      webIDFromEmail = emailToWebID(email);
    } catch (error) {
      console.error('Invalid email format during account creation', error);
      return {
        error: 'Invalid email format',
      };
    }

    //check if this user has already been created/stored locally
    let existingWebID = await (this.userShape as any)
      .select((p) => [p.givenName, p.familyName, p.telephone])
      .for(webIDFromEmail);
    if (existingWebID) {
      console.warn(
        `Account creation attempted for an existing WebID: ${webIDFromEmail}`
      );
      return {
        error:
          'This email address is already in use. Please choose another email or log in with your existing account.',
        action: 'change_email_or_log_in',
      };
    }

    return Auth.login(
      this,
      async () => {
        //we're not trying to log in with an existing account, a new one should be created
        return null;
      },
      async () => {
        //Create a user and a new new account.
        //NOTE: the user URI is now the webID of their profile.
        //And the webID is generated from their email (OR phonenumber)
        const user = await (this.userShape as any)
          .create({
            __id: webIDFromEmail,
            givenName: firstName,
            familyName: lastName,
            telephone: '',
          })
          .catch((err) => {
            console.error(
              `Error creating user ${firstName} ${lastName} - ${email}:`,
              err
            );
            throw new Error(
              `Could not create user ${firstName} ${lastName} - ${email}`
            );
          });

        // generate a new login credential for the user
        const passwordHash = await PasswordHelper.generateHashedPassword(
          password
        );
        await AuthCredential.create({
          credentialOf: {
            id: user.id,
          },
          passwordHash: passwordHash,
        }).catch((err) => {
          console.error(`Error creating password for user ${user.id}:`, err);
          throw new Error(`Could not create password for user ${user.id}`);
        });
        console.log(`created new password for ${user.id}`);

        //create a new account
        const account = await this.accountShape
          .create({
            accountOf: user,
            email: email,
          })
          .catch((err) => {
            console.error(`Error creating account for user ${user.id}:`, err);
            throw new Error(`Could not create account for user ${user.id}`);
          });

        return {
          account: account,
          person: user,
        };
      },
      'createAccount'
    );
  }

  /**
   * Get the password (AuthCredential) for a user
   *
   * @param user - The user
   * @returns The password (AuthCredential)
   */
  async getPasswordForUser(user: QResult<Person>) {
    const credentials = await AuthCredential.select((cred) => {
      return [
        cred.passwordHash,
        cred.credentialOf.select((p) => {
          return [p.givenName, p.familyName, p.telephone];
        }),
      ];
    }).where((cred) => {
      return cred.credentialOf.equals({ id: user.id });
    });

    const credential = credentials.find((candidate) =>
      Boolean(candidate.passwordHash)
    );

    if (!credential) {
      console.warn(`Could not find any password for account ${user.id}`);
      return null;
    }

    return credential;
  }
  /**
   * Reset the password
   *
   * @param password - The new password
   * @param confirmPassword - The confirmed password
   * @param token - The reset password token
   * @returns
   */
  async resetPassword(
    password: string,
    confirmPassword: string,
    token: string
  ): Promise<AuthenticationResult> {
    if (!isAcceptableNewPassword(password)) {
      return {
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      };
    }

    // check if password and confirmPassword match
    if (password !== confirmPassword) {
      return {
        error: 'Passwords do not match',
      };
    }

    //reset password works both if a token is provided, and if a user is currently logged in
    const user: QResult<Person> = token
      ? await PasswordHelper.validateResetPasswordToken(token)
      : this.request?.linkedAuth?.user;

    if (!user) {
      console.warn('No user account found to reset password');
      return {
        error: 'No user account found to reset password',
      };
    }

    //find or create the account of the user
    const account = await this.getOrCreateAccount(user);

    // Phase 1.1: WebID is one-way (UUID v5 of email). Recover email by
    // looking up UserAccount.email keyed on the WebID rather than reversing.
    const emailLookup = await UserAccount.select((ua) => [ua.email])
      .where((ua) => ua.accountOf.equals({ id: user.id } as any))
      .one()
      .catch(() => null);
    const email = (emailLookup as any)?.email ?? null;

    if (!email) {
      console.warn(
        `Could not look up email for webID during password reset: ${user.id}`
      );
      return {
        error: 'Could not determine email address from user account',
      };
    }

    // get the password from the database
    const dbPassword = await this.getPasswordForUser(user);

    // if no password found, create a new one
    if (!dbPassword) {
      console.warn(
        'Password not found for this account : ' +
          user.id +
          'creating one in order to reset password'
      );
      await AuthCredential.createNewCredential(email, password, user);
    } else {
      // update existing password
      const newHashedPassword = await PasswordHelper.generateHashedPassword(
        password
      );

      await AuthCredential.update({
        passwordHash: newHashedPassword,
      }).for(dbPassword);
    }

    // A new password ends every existing session (other devices, and anyone holding a stolen
    // refresh token). The current device gets a fresh session below.
    await revokeAllSessionsForAccount(account.id);

    const person = user;
    return Auth.onSigninSuccessful(this, person, account);
  }

  async getOrCreateAccount(user: QResult<Person>) {
    //get or create account
    let account = await this.accountShape
      .select((a) => a.accountOf)
      .where((a) => a.accountOf.equals({ id: user.id }))
      .one();
    if (!account) {
      //accounts can be created on the fly,
      // it means this user/webID existed, but it's the first time they log in here to this app
      // use account.profileSetupComplete or similar if you want to direct the user to a profile setup page
      account = await this.accountShape.create({
        accountOf: {
          id: user.id,
        },
      });
    }
    return account;
  }

  /**
   * Send the reset password link with zeptoMail
   *
   * @param email - The email address
   * @returns
   */
  async sendResetPasswordLink(email: string) {
    const newToken = PasswordHelper.generateToken();
    const normalizedEmail = email.toLowerCase();
    let webID: string;
    try {
      webID = emailToWebID(normalizedEmail);
    } catch (error) {
      console.error(
        `Invalid email format during password reset request: ${email}`,
        error
      );
      return {
        error: 'Invalid email format',
      };
    }

    const existingCredential = await this.getPasswordForUser({ id: webID });

    if (!existingCredential) {
      const account = await UserAccount.select((ua) => {
        return [
          ua.email,
          ua.accountOf.select((p) => {
            return [p.givenName, p.telephone];
          }),
        ];
      })
        .where((ua) => {
          return ua.email.equals(normalizedEmail);
        })
        .one();

      if (!account?.accountOf?.id) {
        console.warn(`No account found for reset password email ${email}`);
        return {
          error:
            'No password is associated with this account. Please try another login method or contact support.',
        };
      }

      webID = account.accountOf.id;
      await AuthCredential.create({
        credentialOf: {
          id: webID,
        },
        email: normalizedEmail,
        telephone: account.accountOf.telephone || undefined,
        forgotPasswordToken: newToken,
      });
    } else {
      await AuthCredential.update({
        forgotPasswordToken: newToken,
      }).for(existingCredential);
    }

    const person = await this.userShape
      .select((u) => u.givenName)
      .for({ id: webID })
      .one();

    if (!person) {
      console.warn(`No user found for reset password webID ${webID}`);
      return {
        error: 'We could not prepare the reset password link for this account.',
      };
    }

    const confirmUrl = `${process.env.SITE_ROOT}/auth/reset-password?token=${newToken}`;

    const emailOptions = {
      to: [
        {
          email_address: {
            address: email, // destination
            name: normalizedEmail, // recipient Name
          },
        },
      ],
      subject: `Reset Your ${process.env.APP_NAME} Password`,
      htmlbody: `
          <table role='presentation' border='0' cellpadding='0' cellspacing='0' class='body' style='border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fff; width: 100%;' width='100%' bgcolor='#fff'>
            <tr>
              <td>
                <p>Hey ${person.givenName} 👋</p>
                <p>Click the button below to reset your password:</p>
                <a href='${confirmUrl}' target='_blank' style='border: solid 1px #3498db; border-radius: 5px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; background-color: #3498db; border-color: #3498db; color: #ffffff;'>Reset Password</a>
                <p>Cheers,</p>
                <p>${process.env.APP_NAME} Team</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style='font-size: 12px; color: #999;'>Alternatively, you can also copy and paste the link into your browser:</p>
                <a href='${confirmUrl}' target='_blank' style='font-size: 12px;'>${confirmUrl}</a>
              </td>
            </tr>
          </table>
        `,
    };

    // await this.zeptoMail.sendMail(emailOptions);
    return LinkedEmail.send(emailOptions)
      .then(() => {
        return true;
      })
      .catch((error) => {
        console.error('Error sending reset link:', error);
        return {
          error: "Sorry, we couldn't send the email, please try again later",
        };
      });
  }

  /**
   * Sign in with an OAuth provider.
   *
   * The provider credential is verified on the server first and only the
   * claims the provider vouches for are used to find the account:
   *
   * 1. a stored subject link for this provider + subject signs straight in;
   * 2. otherwise an existing account with the same email is attached only when
   *    `decideEmailMatchedAccount` allows it, and fails closed with
   *    `action: 'sign_in_to_link'` when it does not;
   * 3. otherwise a new account is created, without a password.
   *
   * Every sign-in that reaches an account leaves a subject link behind, so the
   * email is only ever consulted once per identity.
   *
   * @param provider - The OAuth provider
   * @param oauthUserData - The provider credential (token) plus, for Apple,
   *   the name the client received on first consent
   */
  async signinOAuth<Provider extends OAuthProvider>(
    provider: Provider,
    oauthUserData: OAuthPayloadMap[Provider]
  ): Promise<AuthenticationResult> {
    if (!isOAuthProvider(provider)) {
      return { error: 'Unsupported OAuth provider' };
    }

    const identity = await verifyOAuthIdentity(provider, oauthUserData);
    if ('error' in identity) return identity;

    let subjectAccount: UserAccountData | undefined;
    let email: string | undefined;
    try {
      const links = await findSubjectLinks(provider, identity.subject);
      const resolution = resolveOAuthAccountInput({
        provider,
        verifiedEmail: identity.email,
        subjectCandidates: links.map((link) => ({
          account: link.account,
          email: link.email,
        })),
      });
      if ('error' in resolution) return { error: resolution.error };
      if ('account' in resolution) subjectAccount = resolution.account;
      email = resolution.email;
    } catch (error) {
      console.error(`${provider} account resolution failed`, error);
      return {
        error: 'Sign-in is temporarily unavailable. Please try again.',
      };
    }

    if (subjectAccount) {
      return Auth.onSigninSuccessful(
        this,
        subjectAccount.accountOf as UserData,
        subjectAccount
      );
    }

    // resolveOAuthAccountInput only returns without an account when it has a
    // verified email.
    email = String(email).trim().toLowerCase();

    let webID: string;
    try {
      webID = emailToWebID(email);
    } catch (error) {
      console.error(`Invalid email format during ${provider} sign-in`);
      return { error: 'Invalid email format' };
    }

    const emailAccounts = await this.accountShape
      .select((account) => [account.email, account.accountOf])
      .where((account) => account.email.equals(email));
    const emailResolution = resolveVerifiedEmailAccount(emailAccounts);
    if (emailResolution.error) return { error: emailResolution.error };

    let existingAccount = emailResolution.account as
      | UserAccountData
      | undefined;
    if (!existingAccount) {
      existingAccount = (await this.accountShape
        .select((account) => [account.email, account.accountOf])
        .where((account) => account.accountOf.equals({ id: webID }))
        .one()) as UserAccountData | undefined;
    }
    let existingPersonId = existingAccount?.accountOf?.id;
    if (!existingPersonId) {
      // A person can exist without an account in this app (accounts are
      // created on the fly), and it may hold a password.
      const person = await (this.userShape as any)
        .select((p) => [p.givenName])
        .for(webID);
      existingPersonId = person?.id;
    }

    if (existingPersonId) {
      const decision = decideEmailMatchedAccount({
        provider,
        existing: {
          hasPassword: await personHasPassword(existingPersonId),
          linkedProviders: existingAccount
            ? await linkedProvidersOfAccount(existingAccount.id)
            : [],
        },
      });
      if ('error' in decision) return decision;

      const person = { id: existingPersonId } as UserData;
      const account =
        existingAccount ??
        ((await this.getOrCreateAccount(person)) as UserAccountData);
      await createSubjectLink(identity, email, account);
      return Auth.onSigninSuccessful(this, person, account);
    }

    return Auth.login(
      this,
      async () => null,
      async () => {
        const user = await (this.userShape as any)
          .create({
            __id: webID,
            givenName: identity.givenName || '',
            familyName: identity.familyName || '',
            telephone: '',
          })
          .catch((err) => {
            console.error(`Error creating ${provider} user:`, err);
            throw new Error(`Could not create ${provider} user`);
          });

        // A credential row without a password hash: it carries the email for
        // password reset, and signinWithPassword ignores rows without a hash.
        await AuthCredential.create({
          credentialOf: {
            id: user.id,
          },
          email: email,
        }).catch((err) => {
          console.error(
            `Error creating credential for ${provider} user ${user.id}:`,
            err
          );
          throw new Error(
            `Could not create credential for ${provider} user ${user.id}`
          );
        });

        const account = await this.accountShape
          .create({
            accountOf: user,
            email: email,
          } as any)
          .catch((err) => {
            console.error(
              `Error creating ${provider} account for user ${user.id}:`,
              err
            );
            throw new Error(
              `Could not create ${provider} account for user ${user.id}`
            );
          });

        await createSubjectLink(identity, email, account as any).catch((err) => {
          console.error(
            `Error creating ${provider} subject link for user ${user.id}:`,
            err
          );
          throw new Error(
            `Could not create ${provider} subject link for user ${user.id}`
          );
        });

        return {
          account: account as any,
          person: user as any,
        };
      },
      `${provider} OAuth`
    );
  }

  /**
   * Connect a provider identity to the account that is signed in right now.
   *
   * This is the explicit, proven way to attach a provider to an existing
   * account: the session proves ownership of the account and the verified
   * token proves ownership of the provider identity. `signinOAuth` refuses to
   * do this by email on its own (`action: 'sign_in_to_link'`) and points here.
   */
  async linkOAuthIdentity<Provider extends OAuthProvider>(
    provider: Provider,
    oauthUserData: OAuthPayloadMap[Provider]
  ): Promise<{ linked: true } | { error: string }> {
    const account = (this.request?.linkedAuth as AuthSession | undefined)
      ?.userAccount;
    if (!account?.id) {
      return { error: 'Sign in first to connect a sign-in method.' };
    }
    if (!isOAuthProvider(provider)) {
      return { error: 'Unsupported OAuth provider' };
    }

    const identity = await verifyOAuthIdentity(provider, oauthUserData);
    if ('error' in identity) return identity;

    const links = await findSubjectLinks(provider, identity.subject);
    const linkedAccountIds = new Set(
      links.map((link) => link.account?.id).filter(Boolean)
    );
    if (linkedAccountIds.size === 1 && linkedAccountIds.has(account.id)) {
      return { linked: true };
    }
    if (linkedAccountIds.size > 0) {
      return {
        error: `This ${provider} account is already connected to another account.`,
      };
    }
    if ((await linkedProvidersOfAccount(account.id)).includes(provider)) {
      return {
        error: `This account is already connected to a different ${provider} account.`,
      };
    }

    await createSubjectLink(identity, identity.email, account);
    return { linked: true };
  }

  /**
   * Temporary sign in without any credentials
   * TODO: how to make this support with WebID? since user doesn't have email
   *
   * Note: we not save AuthCredential for temporary user for now, you need to save it on different way. Example: on register form, etc..
   *
   * @returns
   */
  async signinTemporary() {
    const person = await (this.userShape as any)
      .create({
        givenName: '',
      })
      .catch((err) => {
        console.error('Error creating temporary user:', err);
        throw new Error('Error creating temporary user');
      });
    console.log(`Temporary person created: ${person.id}`);

    const account = await this.accountShape
      .create({
        accountOf: person,
      })
      .catch((err) => {
        console.error('Error creating temporary account:', err);
        throw new Error('Error creating temporary account');
      });
    console.log(`Temporary account created: ${account.id}`);

    account.accountOf = person;

    return await Auth.onSigninSuccessful(
      this,
      person,
      account as UserAccountData,
      true
    );
  }

  /**
   * Dev-mode webid.email sign-in. Counterpart of GET /auth/dev:
   * the iframe loaded from /auth/dev posts {webId, accessToken, refreshToken}
   * to the parent. The frontend forwards that payload here via Server.call.
   *
   * We trust the access token because we signed it ourselves moments ago
   * (DEV_AUTH=true path only — Phase 5.3 swaps in webid.email's JWT).
   *
   * After validating, find or create the Person + UserAccount, then return
   * the standard signin response shape. Workspace provisioning is done by
   * the frontend in a follow-up Server.call to avoid coupling @_linked/auth
   * to CN-specific shapes.
   */
  async signinDev(input: {
    webId: string;
    accessToken: string;
    refreshToken: string;
    email?: string;
  }) {
    // DEV_AUTH gate — tolerate either string 'true' or boolean true.
    // (env-cmd's spread-assign to process.env preserves boolean values.)
    const devAuth = process.env.DEV_AUTH as unknown;
    if (devAuth !== 'true' && devAuth !== true) {
      return { error: 'Dev signin disabled' };
    }
    const tokenResult = await verifyToken({
      request: this.request,
      token: input.accessToken,
      refreshToken: input.refreshToken,
      provider: this,
    });
    if (!tokenResult || (tokenResult as any).error) {
      return { error: (tokenResult as any)?.error ?? 'Invalid token' };
    }
    const claims = (tokenResult as any).payload ?? tokenResult;
    if (claims.sub && claims.sub !== input.webId) {
      return { error: 'WebID does not match token subject' };
    }
    const email = (claims.email as string | undefined) ?? input.email;

    // Dev signin doesn't persist a Person — the WebID profile is hosted by the
    // identity provider (e.g. webid.email). Plain identity data, never a live Shape.
    const person = { id: input.webId } as UserData;

    // Find or create the UserAccount for this Person/WebID.
    const account = await this.getOrCreateAccount(person);
    if (email && !(account as any).email) {
      try {
        await (this.accountShape as any).update({ email }).for(account);
      } catch (err) {
        console.warn('Could not set email on UserAccount:', err);
      }
    }

    return Auth.onSigninSuccessful(this, person, account as UserAccountData);
  }

  async removeAccount() {
    const auth = this.request.linkedAuth;
    if (!auth) {
      return null;
    }

    const account = auth.userAccount;
    const user = auth.user;

    // Cleanup listeners build relation filters from both nodes, so validate
    // them before emitting the event rather than only before final deletion.
    if (!account?.id || !user?.id) {
      throw new Error('Cannot remove account: account or user ID is missing.');
    }

    await emitAccountWillBeRemovedEvent(account);
    await deleteAllSessionsForAccount(account.id);

    // Remove every credential for the user without relying on a projected ID.
    await AuthCredential.deleteWhere((credential) =>
      credential.credentialOf.equals(user)
    );

    //remove account and user
    await this.accountShape.delete({ id: account.id });
    await this.userShape.delete({ id: user.id });

    console.log('Account has been deleted', account.id);
    await this.signout();

    return true;
  }

  /**
   * Sign out: revoke the current session, so its refresh token can no longer be used, and clear
   * the auth cookies.
   *
   * The session is taken from the access token (`sid`) and/or from the refresh token the client
   * passes (native clients) or sends as the `refreshToken` cookie. The access token itself stays
   * valid until it expires (at most AUTH_ACCESS_TOKEN_TTL).
   *
   * @param refreshToken - Optional refresh token of the session to end
   * @returns true if the user was signed in or a session was revoked
   */
  async signout(refreshToken?: string): Promise<boolean> {
    const request = this.request;
    const response = this.response;
    try {
      const auth: any = request?.linkedAuth;
      refreshToken = refreshToken || this.getRefreshTokenFromRequest(request);

      const sessionIds = new Set<string>();
      if (auth?.sid) {
        sessionIds.add(auth.sid);
      }
      if (refreshToken) {
        const sessionId = await findSessionIdForRefreshToken(refreshToken);
        if (sessionId) sessionIds.add(sessionId);
      }

      let revoked = 0;
      for (const sessionId of sessionIds) {
        revoked += await revokeSession(sessionId);
      }
      return Boolean(auth) || revoked > 0;
    } catch (err) {
      console.warn('error during signout: ', err.toString());
      throw err;
    } finally {
      // whatever happened to the session, this browser is signed out
      clearAuthCookies(request, response);
    }
  }

  /**
   * Validate the client's tokens and return the authentication result. This is also where the
   * client refreshes: the response sets new cookies and carries the new access token.
   *
   * - A valid access token (and no `forceRefresh`): returned as is.
   * - Otherwise, with a refresh token (the httpOnly `refreshToken` cookie, or the argument from a
   *   native client): the refresh token is exchanged (see utils/sessions.ts) for a new access
   *   token and, normally, a new refresh token. The old refresh token is then dead.
   * - A refresh that fails clears the auth cookies.
   *
   * @param refreshToken - Optional refresh token (native clients; browsers send the cookie)
   * @param options.forceRefresh - refresh even if the access token is still valid (the client's
   *   scheduler does this shortly before `exp`)
   * @returns A promise that resolves to an authentication result
   */
  async validateToken(
    refreshToken?: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<AuthenticationResult> {
    const request = this.request;
    const response = this.response;
    refreshToken = refreshToken || this.getRefreshTokenFromRequest(request);
    const candidates = this.getTokenCandidates(request);

    if (candidates.length === 0 && !refreshToken) {
      // no token found in Authorization header or cookies
      return {
        error: 'No token found',
      };
    }

    try {
      let token: string | undefined;
      let payload: ReturnType<typeof verifyAccessToken> = false;
      for (const candidate of candidates) {
        payload = verifyAccessToken(candidate);
        if (payload) {
          token = candidate;
          break;
        }
      }
      if (payload && !(options?.forceRefresh && refreshToken)) {
        const authentication = Auth.setAuthentication(request, payload);
        // Tell the client how long the server honours its refresh token.
        const refreshTokenExpiresAt = refreshToken
          ? await findRefreshTokenExpiry(refreshToken)
          : undefined;
        // Re-set the access cookie when the browser does not hold this token as an httpOnly
        // cookie yet (it came from the header, or from a cookie written by an older client).
        const cookieIsCurrent = (request as any)?.cookies?.accessToken === token;
        return deliverTokens(
          request,
          cookieIsCurrent ? false : response,
          {
            auth: authentication,
            accessToken: token,
            refreshToken,
            ...refreshTokenExpiryFields(refreshTokenExpiresAt),
          },
          { newRefreshToken: false }
        );
      }

      if (refreshToken) {
        return await this.refreshSession(refreshToken);
      }

      return {
        error: 'Invalid token',
      };
    } catch (err) {
      console.error('@_linked/auth: token validation failed', err);
      return {
        error: 'Token decoding error',
      };
    }
  }

  /**
   * Exchange a refresh token for a new access token (and a new refresh token).
   * The user and account are reloaded, and the app's providers can extend the session again
   * (`initialAuthSession` / `extendAuthSession`), exactly as at sign-in.
   */
  protected async refreshSession(
    refreshToken: string
  ): Promise<AuthenticationResult> {
    const request = this.request;
    const response = this.response;
    const rotation = await rotateRefreshToken(refreshToken);
    if (rotation.ok === false) {
      clearAuthCookies(request, response);
      return {
        error: 'Invalid refresh token',
      };
    }

    const account = await this.loadAccountForSession(rotation.accountId);
    if (!account) {
      // the account is gone; nothing may be refreshed for it any more
      await revokeSession(rotation.sessionId);
      clearAuthCookies(request, response);
      return {
        error: 'Invalid refresh token',
      };
    }
    const person = await this.loadUserForSession(account);

    const authentication = await Auth.buildAuthSession(this, person, account);
    const accessToken = await createAccessToken(
      authentication,
      undefined,
      rotation.sessionId
    );
    const linkedAuth = Auth.setAuthentication(request, {
      ...authentication,
      sid: rotation.sessionId,
    });

    return deliverTokens(
      request,
      response,
      {
        auth: linkedAuth,
        accessToken,
        refreshToken: rotation.refreshToken,
        ...refreshTokenExpiryFields(rotation.refreshTokenExpiresAt),
      },
      { refreshTokenExpiresAt: rotation.refreshTokenExpiresAt }
    );
  }

  /** The account a refresh token was issued to, with the fields a sign-in provides. */
  protected async loadAccountForSession(
    accountId: string
  ): Promise<UserAccountData | null> {
    const account: any = await (this.accountShape as any)
      .select((a) => [a.email, a.accountOf])
      .for({ id: accountId });
    if (!account || !account.accountOf) {
      return null;
    }
    return account as UserAccountData;
  }

  /**
   * The person behind an account. Not every person is stored locally (a WebID can be hosted by
   * the identity provider), so this falls back to the bare id.
   */
  protected async loadUserForSession(
    account: UserAccountData
  ): Promise<UserData> {
    const id = (account.accountOf as any)?.id;
    try {
      const person = await (this.userShape as any)
        .select((p) => [p.givenName, p.familyName, p.telephone])
        .for({ id });
      if (person) return person as UserData;
    } catch (err) {
      console.warn(`@_linked/auth: could not load person ${id} for refresh`, err);
    }
    return { id } as UserData;
  }

  /**
   * Gets the access token from the request: the Bearer header, else the `accessToken` cookie.
   * @protected
   */
  protected getTokenFromRequest(req: Request) {
    return this.getTokenCandidates(req)[0] ?? null;
  }

  /**
   * The access tokens a request carries, in the order they are tried: the Bearer header first,
   * then the `accessToken` cookie. Both are tried because a browser tab may hold a stale token in
   * memory (sent as the header) while the httpOnly cookie was already renewed by another tab.
   * @protected
   */
  protected getTokenCandidates(req: Request): string[] {
    const tokens: string[] = [];
    const header = req?.headers?.authorization;
    if (header && header.split(' ')[0] === 'Bearer' && header.split(' ')[1]) {
      tokens.push(header.split(' ')[1]);
    }
    const cookie = (req as any)?.cookies?.accessToken;
    if (cookie && !tokens.includes(cookie)) {
      tokens.push(cookie);
    }
    return tokens;
  }

  // get refresh token from request (the httpOnly cookie)
  protected getRefreshTokenFromRequest(req: Request) {
    return (req as any)?.cookies && (req as any).cookies.refreshToken;
  }
}
