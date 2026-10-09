import { Person as SchemaPerson } from '@_linked/schema/shapes/Person';
import type { Shape } from '@_linked/core/shapes/Shape';
import { UserAccount } from '@_linked/sioc/shapes/UserAccount';
import { BackendProvider } from '@_linked/server-utils/utils/BackendProvider';
import { declareInternal } from '@_linked/server-utils/utils/callable';
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
  CreateAccount,
  OAuthProvider,
  UserAccountData,
  UserData,
} from './types/auth.js';
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
  offAccountWillBeRemoved,
} from './utils/events.js';
import AppleHelper from './helpers/apple.js';
import GoogleHelper from './helpers/google.js';
import PasswordHelper from './helpers/password.js';
import { IdentityToken } from './shapes/IdentityToken.js';
import path, { dirname, basename } from 'path';
import { LinkedEmail } from '@_linked/server-utils/utils/LinkedEmail';
import { QResult } from '@_linked/core/queries/SelectQuery';
import type { AuthSession } from './types/auth.js';

import connect_sqlite3 from 'connect-sqlite3';
import { emailToWebID } from './utils/webID.js';

var SQLiteStore = connect_sqlite3(session);

/**
 * The OAuth providers `signinOAuth` verifies cryptographically. Any other provider (facebook
 * included) is rejected: without verification its email would be the client's word.
 */
const VERIFIED_OAUTH_PROVIDERS: readonly string[] = ['google', 'apple'];

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

export default class AuthBackendProvider extends BackendProvider {
  public accountShape: typeof UserAccount = UserAccount;
  public userShape: typeof SchemaPerson = SchemaPerson;
  protected zeptoMail: SendMailClient;
  // Plan-011 — store the listener so dispose() can unsubscribe it.
  // Anonymous inline callbacks would leak across HMR reloads.
  private accountRemovedListener?: (account: UserAccountData) => Promise<void>;

  async setupBeforeControllers() {
    // Fail at startup, not on the first sign-in, when a production deployment lacks its secrets.
    // This is the first thing the package runs at boot. The error is a FatalConfigError
    // (`fatal: true`), which @_linked/server re-throws to abort startup instead of logging the
    // failed hook and serving with broken auth.
    const { jwtSecret, sessionSecret } = assertAuthSecrets(filename__);

    //if defined, take the values from the environment variables to define the shapes for the account and user
    await this.assignEnvPathToField('AUTH_ACCOUNT_TYPE', 'accountShape');
    await this.assignEnvPathToField('AUTH_USER_TYPE', 'userShape');

    this.accountRemovedListener = async (account: UserAccountData) => {
      try {
        await deleteAllSessionsForAccount(account?.id);
      } catch (err) {
        console.error('Could not delete the refresh tokens of a removed account', err);
      }
    };
    onAccountWillBeRemoved(this.accountRemovedListener);

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
    if (this.accountRemovedListener) {
      offAccountWillBeRemoved(this.accountRemovedListener);
      this.accountRemovedListener = undefined;
    }
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
    let webID: string;
    try {
      webID = emailToWebID(email);
    } catch (error) {
      console.error('Invalid email format during signin');
      return {
        error: 'Invalid email format',
      };
    }

    // find any passwords for accounts with this email
    // and select the hash and account/person details
    let existingCredential = await this.getPasswordForUser({ id: webID });

    if (!existingCredential) {
      console.warn(
        'No password found for this WebID, checking the account by email'
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

      existingCredential = await AuthCredential.select((ac) => {
        return [
          ac.passwordHash,
          ac.credentialOf.select((p) => {
            return [p.givenName, p.familyName, p.telephone];
          }),
        ];
      })
        .where((ac) => {
          return ac.credentialOf.equals(account.accountOf);
        })
        .one();

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

    await this.upgradePasswordHash(existingCredential, plainPassword);

    const person = existingCredential.credentialOf;

    const account = await this.getOrCreateAccount(person);

    return Auth.onSigninSuccessful(this, person, account);
  }

  /**
   * Re-hash a password that was just verified, if its stored hash has a lower cost than
   * `PASSWORD_HASH_COST`. Only `passwordHash` is written. A failure is logged and otherwise
   * ignored: it must never fail the sign-in, and the next sign-in tries again.
   */
  protected async upgradePasswordHash(
    credential: { id: string; passwordHash?: string },
    plainPassword: string
  ): Promise<void> {
    if (!PasswordHelper.needsRehash(credential.passwordHash)) return;
    try {
      const passwordHash = await PasswordHelper.generateHashedPassword(plainPassword);
      await AuthCredential.update({ passwordHash }).for({ id: credential.id });
    } catch (error) {
      console.error(`Could not upgrade the password hash of credential ${credential.id}:`, error);
    }
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
    if (!firstName || !email) {
      return {
        error: 'No first name or email are provided',
      };
    }

    let webIDFromEmail: string;
    try {
      webIDFromEmail = emailToWebID(email);
    } catch (error) {
      console.error('Invalid email format during account creation');
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
        `Account creation attempted with an email already in use (webID: ${webIDFromEmail})`
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
            console.error(`Error creating user ${webIDFromEmail}:`, err);
            throw new Error(`Could not create user ${webIDFromEmail}`);
          });

        // generate a new login credential for the user
        const passwordHash = await PasswordHelper.generateHashedPassword(
          password
        );
        const newCredential = await AuthCredential.create({
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

        console.log(`new user ${user.id}, account ${account.id}`);

        return {
          account: account,
          person: user,
        };
      },
      `createAccount - ${firstName} ${lastName} - ${email}`
    );
  }

  /**
   * Get the password (AuthCredential) for a user
   *
   * @param user - The user
   * @returns The password (AuthCredential)
   */
  async getPasswordForUser(user: QResult<Person>) {
    const credential = await AuthCredential.select((cred) => {
      return [
        cred.passwordHash,
        cred.credentialOf.select((p) => {
          return [p.givenName, p.familyName, p.telephone];
        }),
      ];
    })
      .where((cred) => {
        return cred.credentialOf.equals({ id: user.id });
      })
      .one();

    if (!credential) {
      console.warn(`Could not find any password for account ${user.id}`);
      return null;
    }

    return credential;
  }
  /**
   * Reset the password (with a token from the reset email), or change it (signed in).
   *
   * With a token (from a link sent by `sendResetPasswordLink`), the token is used up by this
   * call: it works once, and only until it expires (`AUTH_PASSWORD_RESET_TTL`).
   *
   * Without a token the signed-in user's password is changed, and `currentPassword` must be
   * their current password. An account that has no password yet (e.g. OAuth only) cannot get
   * one this way: it gets one through the reset email, and is told so (`action:
   * 'reset_password_by_email'`).
   *
   * Either way any outstanding reset link stops working.
   *
   * @param password - The new password
   * @param confirmPassword - The confirmed password
   * @param token - The reset password token, if any
   * @param currentPassword - The current password; required when there is no token
   * @returns
   */
  async resetPassword(
    password: string,
    confirmPassword: string,
    token?: string,
    currentPassword?: string
  ): Promise<AuthenticationResult> {
    // check if password and confirmPassword match
    if (password !== confirmPassword) {
      return {
        error: 'Passwords do not match',
      };
    }

    //reset password works both if a token is provided, and if a user is currently logged in
    // A token is used up here, before anything else can fail: a link must never work twice.
    const user: QResult<Person> | undefined = token
      ? await PasswordHelper.consumeResetPasswordToken(token)
      : this.request?.linkedAuth?.user;

    if (!user) {
      console.warn('No user account found to reset password');
      return {
        error: 'No user account found to reset password',
      };
    }

    // get the password from the database
    const dbPassword = await this.getPasswordForUser(user);

    // Without a token, this is a signed-in change: it needs the current password, so a session
    // alone (an unattended device, a stolen access token) cannot take over the account.
    if (!token) {
      if (!dbPassword?.passwordHash) {
        return {
          error:
            'This account has no password yet. Use the reset password email to set one.',
          action: 'reset_password_by_email',
        };
      }
      if (!currentPassword || typeof currentPassword !== 'string') {
        return {
          error: 'Your current password is required to change your password',
        };
      }
      const currentIsValid = await PasswordHelper.checkPassword(
        currentPassword,
        dbPassword.passwordHash
      );
      if (!currentIsValid) {
        return {
          error: 'Your current password is incorrect',
        };
      }
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

    // if no password found, create a new one (only reachable with a valid reset token)
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

      // a new password also ends any reset link still outstanding for it
      await AuthCredential.update({
        passwordHash: newHashedPassword,
        ...PasswordHelper.clearedResetPasswordTokenFields(),
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
    // Only the hash is stored, with an expiry. Writing it replaces any earlier link's token.
    const resetTokenFields = PasswordHelper.resetPasswordTokenFields(newToken);
    const normalizedEmail = email.toLowerCase();
    let webID: string;
    try {
      webID = emailToWebID(normalizedEmail);
    } catch (error) {
      console.error('Invalid email format during password reset request');
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
        console.warn('No account found for a reset password request');
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
        ...resetTokenFields,
      });
    } else {
      await AuthCredential.update(resetTokenFields).for(existingCredential);
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
   * Sign in with OAuth provider
   *
   * Only providers whose token this server verifies itself are accepted (see
   * VERIFIED_OAUTH_PROVIDERS). The email that is signed in always comes from the verified token,
   * never from the client: `Auth.login` signs in as whoever owns that email.
   *
   * @param provider - The OAuth provider
   * @param oauthUserData
   * @returns
   */
  async signinOAuth(
    provider: OAuthProvider,
    oauthUserData: any
  ): Promise<AuthenticationResult> {
    if (!VERIFIED_OAUTH_PROVIDERS.includes(provider)) {
      console.error(
        `signinOAuth: rejected provider ${JSON.stringify(provider)}, ` +
          `only ${VERIFIED_OAUTH_PROVIDERS.join(', ')} can be verified`
      );
      return { error: 'Unsupported OAuth provider' };
    }
    oauthUserData = oauthUserData || {};

    // `email` is deliberately not read from oauthUserData: it is set below from a verified token.
    let email: string | undefined;
    let { name, familyName, givenName, identityToken } = oauthUserData;

    console.log(
      provider +
        ' oAuthData keys:' +
        Object.keys(oauthUserData)
          .filter((key) => oauthUserData[key] && true)
          .join(', ')
    );

    // Handle Apple Sign-In with Identity Token
    // The email must come from a verified token: without one, the client-supplied email would be
    // trusted as is.
    if (provider === 'apple') {
      if (!identityToken) {
        console.error('Apple OAuth: No identity token provided');
        return { error: 'No Apple identity token provided' };
      }

      const applePayload = await AppleHelper.decodeIdentityToken(identityToken);
      if (!applePayload) {
        console.error('Apple OAuth: Invalid identity token');
        return { error: 'Invalid Apple identity token' };
      }

      // use extracted email from Apple token
      email = applePayload.email;

      // store sub for later use when creating IdentityToken
      oauthUserData._appleSub = applePayload.sub;

    }

    // handle Google OAuth
    if (provider === 'google') {
      // Validate Google ID token
      const idToken = oauthUserData.authentication?.idToken;
      if (!idToken) {
        console.error('Google OAuth: No ID token provided');
        return { error: 'No Google ID token provided' };
      }

      // Validate the Google ID token using GoogleHelper
      const googlePayload = await GoogleHelper.validateIdToken(idToken);
      if (!googlePayload) {
        console.error('Google OAuth: Invalid ID token');
        return { error: 'Invalid Google ID token' };
      }

      // Extract user data from validated Google payload
      email = googlePayload.email;
      name = googlePayload.name;
      givenName = googlePayload.given_name;
      familyName = googlePayload.family_name;

    }

    // Check if email is provided
    if (!email) {
      // Never log oauthUserData: it carries the provider's token.
      console.log(`signinOAuth: no verified email from ${provider}`);
      return { error: 'could not find email in OAuth response' };
    }

    // use Auth.login pattern like createAccount; `email` comes from the verified token
    return Auth.login(
      this,
      async () => {
        // before we create a new user and account, check if the user already exists
        // if exists, return the existing account and person so user can be signed in directly
        let webID: string;
        try {
          webID = emailToWebID(email);
        } catch (error) {
          console.error('Invalid email format during OAuth signin');
          return null;
        }

        const existingAccount = await this.accountShape
          .select((a) => {
            return [
              a.email,
              a.accountOf.select((p) => [
                p.givenName,
                p.familyName,
                p.telephone,
              ]),
            ];
          })
          .where((a) => {
            return a.accountOf.equals({
              id: webID,
            });
          })
          .one();

        if (!existingAccount) {
          return null;
        }

        return {
          account: existingAccount,
          person: existingAccount.accountOf,
        };
      },
      async () => {
        // create new user and account
        let webID: string;
        try {
          webID = emailToWebID(email);
        } catch (error) {
          console.error('Invalid email format during OAuth account creation');
          throw new Error(
            `Could not create ${provider} account: invalid email format`
          );
        }

        // prepare user data based on the provider
        const userData = {
          __id: webID,
          givenName: givenName || '',
          familyName: familyName || '',
          telephone: '',
        };

        // create user
        const user = await (this.userShape as any)
          .create(userData)
          .catch((err) => {
            console.error(`Error creating ${provider} user ${webID}:`, err);
            throw new Error(`Could not create ${provider} user ${webID}`);
          });

        // Create AuthCredential for OAuth user (no password needed)
        const newCredential = await AuthCredential.create({
          credentialOf: {
            id: user.id,
          },
          email: email,
          // No passwordHash for OAuth users
        }).catch((err) => {
          console.error(
            `Error creating credential for ${provider} user ${user.id}:`,
            err
          );
          throw new Error(
            `Could not create credential for ${provider} user ${user.id}`
          );
        });
        console.log(`created new credential for ${user.id}`);

        // Create account
        const accountData: any = {
          accountOf: user,
          email: email,
        };

        // create account
        const account = await this.accountShape
          .create(accountData)
          .catch((err) => {
            console.error(
              `Error creating ${provider} account for user ${user.id}:`,
              err
            );
            throw new Error(
              `Could not create ${provider} account for user ${user.id}`
            );
          });

        // Save Apple IdentityToken if this is an Apple sign-in
        if (provider === 'apple' && identityToken && oauthUserData._appleSub) {
          await IdentityToken.create({
            token: identityToken,
            email: email,
            sub: oauthUserData._appleSub as string,
            account: account,
          }).catch((err) => {
            console.error(
              `Error creating Apple IdentityToken for user ${user.id}:`,
              err
            );
            throw new Error(
              `Could not create Apple IdentityToken for user ${user.id}`
            );
          });
        }

        console.log(`${provider} user ${user.id} created, account ${account.id}`);

        return {
          account: account as any,
          person: user as any,
        };
      },
      `${provider} OAuth`
    );
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
    /** Ignored: the email comes from the verified token. Kept so existing callers still type-check. */
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
    // Only the verified token's email claim; `input.email` is the client's word and never stored.
    const email = claims.email as string | undefined;

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

    await emitAccountWillBeRemovedEvent(account);
    await deleteAllSessionsForAccount(account.id);

    // before remove the account and user, we need to remove the other related data authentication
    const password = await this.getPasswordForUser(user);
    // delete by reference: these results carry nested data, which delete() rejects
    if (password) {
      await AuthCredential.delete({ id: password.id });
    }

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

/**
 * Methods the server must never dispatch over HTTP (`/call/@_linked/auth/...`). They act on a
 * credential, person or account the caller names, without checking who is asking, and are only
 * meant to be called by this provider's own sign-in, reset and refresh code. Exposed, they would
 * let anyone set a credential's password hash (`upgradePasswordHash`), read a password hash
 * (`getPasswordForUser`), create an account for any WebID (`getOrCreateAccount`), or read an
 * account's email or a person's details (`loadAccountForSession`, `loadUserForSession`).
 *
 * An internal declaration is inherited, so a subclass that overrides one of these stays covered.
 * Backend-to-backend calls are unaffected.
 */
declareInternal(AuthBackendProvider, [
  'upgradePasswordHash',
  'getPasswordForUser',
  'getOrCreateAccount',
  'loadAccountForSession',
  'loadUserForSession',
]);
