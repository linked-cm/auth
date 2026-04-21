"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
const Person_1 = require("@_linked/schema/shapes/Person");
const Server_1 = require("@_linked/server-utils/utils/Server");
const useAuth_js_1 = require("../hooks/useAuth.js");
const jwt_js_1 = require("./jwt.js");
const QueryContext_1 = require("@_linked/core/queries/QueryContext");
class Auth {
    /**
     * Login method
     *
     * @param request - The incoming request
     * @param findAccount - Function to find an existing account, will log in with this account if it's found
     * @param createAccount - Function to set new data for the user and account
     * @param logMethodName - Name of the log method
     * @returns - Returns the result of the sign-in process
     */
    static login(provider, findAccount, createAccount, logMethodName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`login method: ${logMethodName}`);
            let person, account;
            const existing = yield findAccount();
            if (existing) {
                person = existing.person;
                account = existing.account;
            }
            else {
                // uri = process.env.DATA_ROOT + '/account_' + luid;
                const newAccount = yield createAccount();
                person = newAccount.person;
                account = newAccount.account;
            }
            return this.onSigninSuccessful(provider, person, account, !existing);
        });
    }
    /**
     * Enforces that the user is signed in. If not, it will return a response action to enforce sign in.
     * @returns - Returns a response action to enforce sign in.
     */
    static enforceSignedIn() {
        return Server_1.Server.createResponseAction(useAuth_js_1.ENFORCE_SIGNED_IN);
    }
    /**
     * Handle successful sign-in and return authentication result
     * This also ensures that the provided person and account will available on the frontend with useAuth() (from lincd-auth)
     * This method should be used by any other package that implements authentication and wants to persist a successful login
     *
     * @param request - The incoming request
     * @param person - The authenticated person
     * @param account - The user account associated with the person
     * @returns A promise that resolves to an authentication result and tokens
     */
    static onSigninSuccessful(provider_1, person_1, account_1) {
        return __awaiter(this, arguments, void 0, function* (provider, person, account, isNewAccount = false) {
            console.log('Successful sign-in, sending back to frontend. Person: ' +
                person.id +
                ' Account: ' +
                account.id);
            const request = provider.request;
            const server = provider.lincdServer;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // create authentication object
                    let authentication = {
                        userAccount: account,
                        user: person,
                    };
                    //Give the app its backend provider a chance to extend the authentication data with the default user and account data
                    //NOTE: this will be things like false/undefined values for extra properties that are not set yet
                    yield server.callGenericBackendProvidersMethod('initialAuthSession', authentication);
                    //if this is not a new account, then it makes sense to allow backend providers
                    // to actually extend the authentication session.
                    //(if it IS a new account, we can just save the extra query and rely on the default values)
                    if (!isNewAccount) {
                        yield server.callGenericBackendProvidersMethod('extendAuthSession', authentication);
                    }
                    // create JWT tokens for the person and account
                    const { accessToken, refreshToken } = yield (0, jwt_js_1.createToken)(authentication);
                    //update: we don't need to save the token to the database, it only lives on the front-end
                    // // save refresh token to database
                    // if (refreshToken) {
                    //   const token = await RefreshToken.create({
                    //     token: refreshToken,
                    //     account: account,
                    //   });
                    //   console.log(`token`, JSON.stringify(token));
                    // }
                    // set authentication to the request
                    Auth.setAuthentication(request, authentication);
                    resolve({
                        auth: authentication,
                        accessToken,
                        refreshToken,
                        // user: person,
                        // userAccount: account,
                    });
                }
                catch (err) {
                    console.error('Failed to create token', err);
                    reject(err);
                }
            }));
        });
    }
    static setAuthentication(request, authentication) {
        const updateSessionData = (updatedData) => __awaiter(this, void 0, void 0, function* () {
            // create completely new user and userAccount objects to avoid reference issues
            const updatedUser = Object.assign(Object.assign({}, request.linkedAuth.user), updatedData.user);
            const updatedUserAccount = Object.assign(Object.assign({}, request.linkedAuth.userAccount), updatedData.userAccount);
            // make sure accountOf sync with new user data
            // updatedUserAccount.accountOf = updatedUser;
            // create a new auth session object
            const newAuthSession = {
                user: updatedUser,
                userAccount: updatedUserAccount,
                updateSessionData, // Keep the reference to this function
            };
            // Update request.linkedAuth to point to the new session
            request.linkedAuth = newAuthSession;
            // Set query context for user and userAccount
            (0, QueryContext_1.setQueryContext)('user', updatedUser, Person_1.Person);
            (0, QueryContext_1.setQueryContext)('userAccount', updatedUserAccount, UserAccount_1.UserAccount);
            const { accessToken, refreshToken } = yield (0, jwt_js_1.createToken)(request.linkedAuth);
            return {
                auth: {
                    user: request.linkedAuth.user,
                    userAccount: request.linkedAuth.userAccount,
                },
                accessToken,
                refreshToken,
            };
        });
        const linkedAuth = Object.assign(Object.assign({}, authentication), { updateSessionData });
        request.linkedAuth = linkedAuth;
        // Set query context for user and userAccount
        (0, QueryContext_1.setQueryContext)('user', linkedAuth.user, Person_1.Person);
        (0, QueryContext_1.setQueryContext)('userAccount', linkedAuth.userAccount, UserAccount_1.UserAccount);
        // console.log(`setAuthentication:`, {
        //   "linkedAuth.user": linkedAuth.user,
        //   "linkedAuth.userAccount": linkedAuth.userAccount,
        // });
        return linkedAuth;
    }
}
exports.Auth = Auth;
// define the default user and account types
Auth.userType = Person_1.Person;
Auth.accountType = UserAccount_1.UserAccount;
//# sourceMappingURL=auth.js.map