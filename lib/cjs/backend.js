"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Person_1 = require("@_linked/schema/shapes/Person");
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
const BackendProvider_1 = require("@_linked/server-utils/utils/BackendProvider");
const express_session_1 = __importDefault(require("express-session"));
const auth_js_1 = require("./utils/auth.js");
const zeptomail_1 = require("zeptomail");
const AuthCredential_js_1 = require("./shapes/AuthCredential.js");
const express_jwt_1 = require("express-jwt");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jwt_js_1 = require("./utils/jwt.js");
const RefreshToken_js_1 = require("./shapes/RefreshToken.js");
const events_js_1 = require("./utils/events.js");
const apple_js_1 = __importDefault(require("./helpers/apple.js"));
const google_js_1 = __importDefault(require("./helpers/google.js"));
const password_js_1 = __importDefault(require("./helpers/password.js"));
const IdentityToken_js_1 = require("./shapes/IdentityToken.js");
const path_1 = __importStar(require("path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const LinkedEmail_1 = require("@_linked/server-utils/utils/LinkedEmail");
const connect_sqlite3_1 = __importDefault(require("connect-sqlite3"));
const webID_js_1 = require("./utils/webID.js");
var SQLiteStore = (0, connect_sqlite3_1.default)(express_session_1.default);
__exportStar(require("./shapes/AuthCredentialProvider.js"), exports);
const filename__ = typeof __filename !== 'undefined'
    ? __filename
    : //@ts-ignore
        (0, path_1.basename)(import.meta.url).replace('file:/', '');
class AuthBackendProvider extends BackendProvider_1.BackendProvider {
    constructor() {
        super(...arguments);
        this.accountShape = UserAccount_1.UserAccount;
        this.userShape = Person_1.Person;
    }
    setupBeforeControllers() {
        return __awaiter(this, void 0, void 0, function* () {
            //if defined, take the values from the environment variables to define the shapes for the account and user
            yield this.assignEnvPathToField('AUTH_ACCOUNT_TYPE', 'accountShape');
            yield this.assignEnvPathToField('AUTH_USER_TYPE', 'userShape');
            (0, events_js_1.onAccountWillBeRemoved)((account) => __awaiter(this, void 0, void 0, function* () {
                const refreshTokens = yield RefreshToken_js_1.RefreshToken.select((rt) => [
                    rt.account,
                ]).where((rt) => rt.account.equals(account));
                if (refreshTokens.length > 0) {
                    for (const refreshToken of refreshTokens) {
                        yield RefreshToken_js_1.RefreshToken.delete(refreshToken);
                    }
                }
            }));
            // set the user and account shapes for auth
            auth_js_1.Auth.userType = this.userShape;
            auth_js_1.Auth.accountType = this.accountShape;
            // set zeptoMail client
            this.zeptoMail = new zeptomail_1.SendMailClient({
                url: 'api.zeptomail.com/',
                token: process.env.ZEPTOMAIL_TOKEN,
            });
            // FOR initial page requests we send the JWT token as a cookie (Stored in the browser)
            // see getToken for how we use the cookie and set this.request.linkedAuth
            this.server.use((0, cookie_parser_1.default)());
            // For API requests, we send a token as the Bearer header
            // It gets parsed by this middleware and the result is that
            // on getToken we catch first every request and check the headers or cookies
            // and if has, we set into this.request.linkedAuth
            this.server.use((0, express_jwt_1.expressjwt)({
                secret: process.env.JWT_SECRET || 'jwt-secret', // need to set this environment variable
                algorithms: ['HS256'],
                credentialsRequired: false, // allows unauthenticated requests to pass through
                getToken: (req) => __awaiter(this, void 0, void 0, function* () {
                    return this.validateRequestToken(req);
                }),
                // called only when exp has passed
                onExpired: (req, err) => __awaiter(this, void 0, void 0, function* () {
                    // …issue a new token or just keep going
                    // req.auth will be undefined, so unauthenticated routes still work
                    yield this.validateRequestToken(req, true);
                }),
            }).unless({
                // Skip token verification for all static assets
                path: [
                    /^\/public\/.*/, // anything under /public
                    /^\/uploads\/.*/, // anything under /uploads
                    /^\/resized\/.*/, // dynamically‑resized images
                    /^\/favicon\.ico$/, // favicon
                    /^\/\.well-known\/.*/, // ACME challenges etc.
                ],
            }));
            let secret;
            if (process.env.SESSION_SECRET) {
                secret = process.env.SESSION_SECRET;
            }
            else {
                if (process.env.NODE_ENV !== 'development') {
                    console.warn('Please set the environment variable SESSION_SECRET\n' +
                        'This is to ensure the sessions of this app are securely stored.\n' +
                        'Preferably use a string of mixed characters. If this is a LINCD app, you can add the SESSION_SECRET to `.env-cmdrc.json`.\n' +
                        'For now a less secure fallback method will be used.\n' +
                        'See also https://www.npmjs.com/package/express-session#secret and https://www.npmjs.com/package/cookie-session#secret\n');
                }
                secret = node_crypto_1.default.createHash('md5').update(filename__).digest('hex');
            }
            this.server.use((0, express_session_1.default)({
                secret: secret,
                name: '@_linked/auth',
                //TODO: this broke sessions in production, need to check what else we need to do to make secure sessions work
                // cookie: {secure: process.env.NODE_ENV === 'production'},
                resave: true,
                saveUninitialized: false,
                store: new SQLiteStore({
                    dir: path_1.default.join(process.cwd(), 'data'),
                }),
            }));
        });
    }
    validateRequestToken(request_1) {
        return __awaiter(this, arguments, void 0, function* (request, accessTokenExpired = false) {
            // get the token from request headers or cookies
            let token = this.getTokenFromRequest(request);
            let refreshToken = this.getRefreshTokenFromRequest(request);
            // if token is found, validate it
            if (token) {
                const verificationResult = yield (0, jwt_js_1.verifyToken)({
                    request,
                    token,
                    refreshToken,
                    provider: this,
                    accessTokenExpired,
                });
                // if token is valid, set the authentication object
                if (verificationResult) {
                    let authentication = yield auth_js_1.Auth.setAuthentication(request, verificationResult.payload);
                    if (!authentication) {
                        console.log(`GET TOKEN authentication: no authentication`);
                        return null;
                    }
                    return verificationResult.accessToken;
                }
            }
            return null;
        });
    }
    /**
     * Initialize the incoming request
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     */
    initRequest(request, response) {
        const _super = Object.create(null, {
            initRequest: { get: () => super.initRequest }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.initRequest.call(this, request, response);
        });
    }
    // TODO: check possible to remove this method?
    checkSignin() {
        var _a;
        //this is a temporary fix that allows the frontend to check if the user is still logged in on the backend
        return (_a = this.request.linkedAuth) === null || _a === void 0 ? void 0 : _a.userAccount;
    }
    /**
     * Supply data for the incoming request
     * This data will then be available on the frontend right upon initialisation
     *
     * @param request - The incoming request
     * @param response - The outgoing response
     * @param dataQuads - The set of data quads to be populated
     */
    supplyDataForRequest(request, response, dataQuads) {
        return __awaiter(this, void 0, void 0, function* () {
            //if logged in and we're collecting frontend data
            if (request.linkedAuth && request.frontendData) {
                const requestAuth = Object.assign({}, request.linkedAuth);
                //Remove things that should not go to the frontend
                delete requestAuth.updateSessionData;
                //Store in the object that will be sent to the frontend
                request.frontendData.auth = requestAuth;
            }
        });
    }
    /**
     * Sign in with email and password
     *
     * @param email - The email address
     * @param plainPassword - The plain password
     * @returns
     */
    signinWithPassword(email, plainPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            let webID;
            try {
                webID = (0, webID_js_1.emailToWebID)(email);
            }
            catch (error) {
                console.error(`Invalid email format during signin: ${email}`, error);
                return {
                    error: 'Invalid email format',
                };
            }
            // find any passwords for accounts with this email
            // and select the hash and account/person details
            let existingCredential = yield this.getPasswordForUser({ id: webID });
            if (!existingCredential) {
                console.warn(`Could not find any password associated with this email: ${email}, so we will check by user email`);
                // we get the user by email, if catch the user from here
                // we can say the user signup with temporary signin
                const account = yield UserAccount_1.UserAccount.select((ua) => {
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
                existingCredential = yield AuthCredential_js_1.AuthCredential.select((ac) => {
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
            const passwordIsValid = yield password_js_1.default.checkPassword(plainPassword, existingCredential.passwordHash);
            if (!passwordIsValid) {
                return {
                    error: 'Invalid email / password combination',
                };
            }
            const person = existingCredential.credentialOf;
            const account = yield this.getOrCreateAccount(person);
            return auth_js_1.Auth.onSigninSuccessful(this, person, account);
        });
    }
    /**
     * Create a new account
     *
     * @param CreateAccount - The account data to create
     * @returns
     */
    createAccount(_a) {
        return __awaiter(this, arguments, void 0, function* ({ firstName, lastName, email, password, }) {
            // check if the first name and email are provided
            if (!firstName || !email) {
                return {
                    error: 'No first name or email are provided',
                };
            }
            let webIDFromEmail;
            try {
                webIDFromEmail = (0, webID_js_1.emailToWebID)(email);
            }
            catch (error) {
                console.error(`Invalid email format during account creation: ${email}`, error);
                return {
                    error: 'Invalid email format',
                };
            }
            //check if this user has already been created/stored locally
            let existingWebID = yield this.userShape
                .select((p) => [p.givenName, p.familyName, p.telephone])
                .for(webIDFromEmail);
            if (existingWebID) {
                console.warn(`Account creation attempted with existing email: ${email} (webID: ${webIDFromEmail})`);
                return {
                    error: 'This email address is already in use. Please choose another email or log in with your existing account.',
                    action: 'change_email_or_log_in',
                };
            }
            return auth_js_1.Auth.login(this, () => __awaiter(this, void 0, void 0, function* () {
                //we're not trying to log in with an existing account, a new one should be created
                return null;
            }), () => __awaiter(this, void 0, void 0, function* () {
                //Create a user and a new new account.
                //NOTE: the user URI is now the webID of their profile.
                //And the webID is generated from their email (OR phonenumber)
                const user = yield this.userShape
                    .create({
                    __id: webIDFromEmail,
                    givenName: firstName,
                    familyName: lastName,
                    telephone: '',
                })
                    .catch((err) => {
                    console.error(`Error creating user ${firstName} ${lastName} - ${email}:`, err);
                    throw new Error(`Could not create user ${firstName} ${lastName} - ${email}`);
                });
                // generate a new login credential for the user
                const passwordHash = yield password_js_1.default.generateHashedPassword(password);
                const newCredential = yield AuthCredential_js_1.AuthCredential.create({
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
                const account = yield this.accountShape
                    .create({
                    accountOf: user,
                    email: email,
                })
                    .catch((err) => {
                    console.error(`Error creating account for user ${user.id}:`, err);
                    throw new Error(`Could not create account for user ${user.id}`);
                });
                console.log(`new user:`, JSON.stringify(user));
                console.log(`new account:`, JSON.stringify(account));
                return {
                    account: account,
                    person: user,
                };
            }), `createAccount - ${firstName} ${lastName} - ${email}`);
        });
    }
    /**
     * Get the password (AuthCredential) for a user
     *
     * @param user - The user
     * @returns The password (AuthCredential)
     */
    getPasswordForUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const credential = yield AuthCredential_js_1.AuthCredential.select((cred) => {
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
        });
    }
    /**
     * Reset the password
     *
     * @param password - The new password
     * @param confirmPassword - The confirmed password
     * @param token - The reset password token
     * @returns
     */
    resetPassword(password, confirmPassword, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // check if password and confirmPassword match
            if (password !== confirmPassword) {
                return {
                    error: 'Passwords do not match',
                };
            }
            //reset password works both if a token is provided, and if a user is currently logged in
            const user = token
                ? yield password_js_1.default.validateResetPasswordToken(token)
                : (_b = (_a = this.request) === null || _a === void 0 ? void 0 : _a.linkedAuth) === null || _b === void 0 ? void 0 : _b.user;
            if (!user) {
                console.warn('No user account found to reset password');
                return {
                    error: 'No user account found to reset password',
                };
            }
            //find or create the account of the user
            const account = yield this.getOrCreateAccount(user);
            const email = (0, webID_js_1.webIDToEmail)(user.id);
            if (!email) {
                console.warn(`Could not extract email from webID during password reset: ${user.id}`);
                return {
                    error: 'Could not determine email address from user account',
                };
            }
            // get the password from the database
            const dbPassword = yield this.getPasswordForUser(user);
            // if no password found, create a new one
            if (!dbPassword) {
                console.warn('Password not found for this account : ' +
                    user.id +
                    'creating one in order to reset password');
                yield AuthCredential_js_1.AuthCredential.createNewCredential(email, password, user);
            }
            else {
                // update existing password
                const newHashedPassword = yield password_js_1.default.generateHashedPassword(password);
                yield AuthCredential_js_1.AuthCredential.update({
                    passwordHash: newHashedPassword,
                }).for(dbPassword);
            }
            const person = user;
            return auth_js_1.Auth.onSigninSuccessful(this, person, account);
        });
    }
    getOrCreateAccount(user) {
        return __awaiter(this, void 0, void 0, function* () {
            //get or create account
            let account = yield this.accountShape
                .select((a) => a.accountOf)
                .where((a) => a.accountOf.equals({ id: user.id }))
                .one();
            if (!account) {
                //accounts can be created on the fly,
                // it means this user/webID existed, but it's the first time they log in here to this app
                // use account.profileSetupComplete or similar if you want to direct the user to a profile setup page
                account = yield this.accountShape.create({
                    accountOf: {
                        id: user.id,
                    },
                });
            }
            return account;
        });
    }
    /**
     * Send the reset password link with zeptoMail
     *
     * @param email - The email address
     * @returns
     */
    sendResetPasswordLink(email) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const newToken = password_js_1.default.generateToken();
            const normalizedEmail = email.toLowerCase();
            let webID;
            try {
                webID = (0, webID_js_1.emailToWebID)(normalizedEmail);
            }
            catch (error) {
                console.error(`Invalid email format during password reset request: ${email}`, error);
                return {
                    error: 'Invalid email format',
                };
            }
            const existingCredential = yield this.getPasswordForUser({ id: webID });
            if (!existingCredential) {
                const account = yield UserAccount_1.UserAccount.select((ua) => {
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
                if (!((_a = account === null || account === void 0 ? void 0 : account.accountOf) === null || _a === void 0 ? void 0 : _a.id)) {
                    console.warn(`No account found for reset password email ${email}`);
                    return {
                        error: 'No password is associated with this account. Please try another login method or contact support.',
                    };
                }
                webID = account.accountOf.id;
                yield AuthCredential_js_1.AuthCredential.create({
                    credentialOf: {
                        id: webID,
                    },
                    email: normalizedEmail,
                    telephone: account.accountOf.telephone || undefined,
                    forgotPasswordToken: newToken,
                });
            }
            else {
                yield AuthCredential_js_1.AuthCredential.update({
                    forgotPasswordToken: newToken,
                }).for(existingCredential);
            }
            const person = yield this.userShape
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
            return LinkedEmail_1.LinkedEmail.send(emailOptions)
                .then(() => {
                return true;
            })
                .catch((error) => {
                console.error('Error sending reset link:', error);
                return {
                    error: "Sorry, we couldn't send the email, please try again later",
                };
            });
        });
    }
    /**
     * Sign in with OAuth provider
     *
     * @param provider - The OAuth provider
     * @param oauthUserData
     * @returns
     */
    signinOAuth(provider, oauthUserData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let { email, name, familyName, givenName, fullName, imageUrl, identityToken, } = oauthUserData;
            console.log(provider +
                ' oAuthData keys:' +
                Object.keys(oauthUserData)
                    .filter((key) => oauthUserData[key] && true)
                    .join(', '));
            // Handle Apple Sign-In with Identity Token
            if (provider === 'apple' && identityToken) {
                const { email: appleEmail, sub } = yield apple_js_1.default.decodeIdentityToken(identityToken);
                // use extracted email from Apple token
                email = appleEmail;
                // store sub for later use when creating IdentityToken
                oauthUserData._appleSub = sub;
                console.log('Apple OAuth validated successfully for:', email);
            }
            // handle Google OAuth
            if (provider === 'google') {
                // Validate Google ID token
                const idToken = (_a = oauthUserData.authentication) === null || _a === void 0 ? void 0 : _a.idToken;
                if (!idToken) {
                    console.error('Google OAuth: No ID token provided');
                    return { error: 'No Google ID token provided' };
                }
                // Validate the Google ID token using GoogleHelper
                const googlePayload = yield google_js_1.default.validateIdToken(idToken);
                if (!googlePayload) {
                    console.error('Google OAuth: Invalid ID token');
                    return { error: 'Invalid Google ID token' };
                }
                // Extract user data from validated Google payload
                email = googlePayload.email;
                name = googlePayload.name;
                givenName = googlePayload.given_name;
                familyName = googlePayload.family_name;
                console.log('Google OAuth validated successfully for:', email);
            }
            // Check if email is provided
            if (!email) {
                console.log('No email provided to signinOAuth: ', provider, oauthUserData);
                return { error: 'could not find email in OAuth response' };
            }
            // use Auth.login pattern like createAccount for Google and other OAuth providers
            return auth_js_1.Auth.login(this, () => __awaiter(this, void 0, void 0, function* () {
                // before we create a new user and account, check if the user already exists
                // if exists, return the existing account and person so user can be signed in directly
                let webID;
                try {
                    webID = (0, webID_js_1.emailToWebID)(email);
                }
                catch (error) {
                    console.error(`Invalid email format during OAuth signin: ${email}`, error);
                    return null;
                }
                const existingAccount = yield this.accountShape
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
            }), () => __awaiter(this, void 0, void 0, function* () {
                // create new user and account
                let webID;
                try {
                    webID = (0, webID_js_1.emailToWebID)(email);
                }
                catch (error) {
                    console.error(`Invalid email format during OAuth account creation: ${email}`, error);
                    throw new Error(`Could not create ${provider} account: invalid email format`);
                }
                // prepare user data based on the provider
                const userData = {
                    __id: webID,
                    givenName: givenName || '',
                    familyName: familyName || '',
                    telephone: '',
                };
                // create user
                const user = yield this.userShape
                    .create(userData)
                    .catch((err) => {
                    console.error(`Error creating ${provider} user - ${email}:`, err);
                    throw new Error(`Could not create ${provider} user - ${email}`);
                });
                // Create AuthCredential for OAuth user (no password needed)
                const newCredential = yield AuthCredential_js_1.AuthCredential.create({
                    credentialOf: {
                        id: user.id,
                    },
                    email: email,
                    // No passwordHash for OAuth users
                }).catch((err) => {
                    console.error(`Error creating credential for ${provider} user ${user.id}:`, err);
                    throw new Error(`Could not create credential for ${provider} user ${user.id}`);
                });
                console.log(`created new credential for ${user.id}`);
                // Create account
                const accountData = {
                    accountOf: user,
                    email: email,
                };
                // create account
                const account = yield this.accountShape
                    .create(accountData)
                    .catch((err) => {
                    console.error(`Error creating ${provider} account for user ${user.id}:`, err);
                    throw new Error(`Could not create ${provider} account for user ${user.id}`);
                });
                // Save Apple IdentityToken if this is an Apple sign-in
                if (provider === 'apple' && identityToken && oauthUserData._appleSub) {
                    yield IdentityToken_js_1.IdentityToken.create({
                        token: identityToken,
                        email: email,
                        subject: oauthUserData._appleSub,
                        account: account,
                    }).catch((err) => {
                        console.error(`Error creating Apple IdentityToken for user ${user.id}:`, err);
                        throw new Error(`Could not create Apple IdentityToken for user ${user.id}`);
                    });
                }
                console.log(`${provider} user created:`, JSON.stringify(user));
                console.log(`${provider} account created:`, JSON.stringify(account));
                return {
                    account: account,
                    person: user,
                };
            }), `${provider} - ${email}`);
        });
    }
    /**
     * Temporary sign in without any credentials
     * TODO: how to make this support with WebID? since user doesn't have email
     *
     * Note: we not save AuthCredential for temporary user for now, you need to save it on different way. Example: on register form, etc..
     *
     * @returns
     */
    signinTemporary() {
        return __awaiter(this, void 0, void 0, function* () {
            const person = yield this.userShape
                .create({
                givenName: '',
            })
                .catch((err) => {
                console.error('Error creating temporary user:', err);
                throw new Error('Error creating temporary user');
            });
            console.log(`Temporary person created: ${person.id}`);
            const account = yield this.accountShape
                .create({
                accountOf: person,
            })
                .catch((err) => {
                console.error('Error creating temporary account:', err);
                throw new Error('Error creating temporary account');
            });
            console.log(`Temporary account created: ${account.id}`);
            account.accountOf = person;
            return yield auth_js_1.Auth.onSigninSuccessful(this, person, account, true);
        });
    }
    removeAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const auth = this.request.linkedAuth;
            if (!auth) {
                return null;
            }
            const account = auth.userAccount;
            const user = auth.user;
            yield (0, events_js_1.emitAccountWillBeRemovedEvent)(account);
            // before remove the account and user, we need to remove the other related data authentication
            const password = yield this.getPasswordForUser(user);
            if (password) {
                yield AuthCredential_js_1.AuthCredential.delete(password);
            }
            //remove account and user
            yield this.accountShape.delete(account);
            yield this.userShape.delete(user);
            console.log('Account has been deleted', account.id);
            this.signout();
            return true;
        });
    }
    /**
     * Sign out the user and remove the refresh token from the database
     *
     * @returns A promise that resolves to a boolean indicating the success of sign-out
     */
    signout() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const auth = this.request.linkedAuth;
                    if (!auth) {
                        resolve(false);
                        return;
                    }
                    resolve(true);
                }
                catch (err) {
                    console.warn('error during signout: ', err.toString());
                    reject(err);
                }
            });
        });
    }
    /**
     * Validate the bearer token header and return the authentication result
     *
     * @param refreshToken - Optional refresh token
     * @returns A promise that resolves to an authentication result
     */
    validateToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // get the token from request headers or cookies
            const request = this.request;
            let token = this.getTokenFromRequest(request);
            refreshToken = refreshToken || this.getRefreshTokenFromRequest(request);
            // if token is found, validate it
            if (token) {
                try {
                    const verificationResult = yield (0, jwt_js_1.verifyToken)({
                        request,
                        token,
                        refreshToken,
                        provider: this,
                    });
                    // if token is valid, set the authentication object
                    // and return the payload with new access token and refresh token
                    if (verificationResult) {
                        const authentication = auth_js_1.Auth.setAuthentication(request, verificationResult.payload);
                        if (!authentication) {
                            return {
                                error: 'Invalid token',
                            };
                        }
                        return {
                            auth: authentication,
                            accessToken: verificationResult.accessToken,
                            refreshToken: verificationResult.refreshToken,
                        };
                    }
                    else {
                        // if token is invalid, return error
                        return {
                            error: 'Invalid token',
                        };
                    }
                }
                catch (err) {
                    // error while decoding token
                    return {
                        error: 'Token decoding error',
                    };
                }
            }
            // no token found in Authorization header or cookies
            return {
                error: 'No token found',
            };
        });
    }
    /**
     * Gets the access token from the request.
     * This method checks the Authorization header for a Bearer token
     * or looks for a cookie named 'accessToken'.
     * @param req
     * @protected
     */
    getTokenFromRequest(req) {
        if (req.headers.authorization &&
            req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies && req.cookies.accessToken) {
            return req.cookies.accessToken;
        }
        return null;
    }
    // get refresh token from request
    getRefreshTokenFromRequest(req) {
        return req.cookies && req.cookies.refreshToken;
    }
}
exports.default = AuthBackendProvider;
//# sourceMappingURL=backend.js.map