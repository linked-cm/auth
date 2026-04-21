import { ShapeProvider } from '@_linked/server-utils/utils/ShapeProvider';
import { AuthCredential } from './AuthCredential.js';
import PasswordHelper from '../helpers/password.js';
export class AuthCredentialProvider extends ShapeProvider {
    constructor() {
        super(...arguments);
        this.shape = AuthCredential;
    }
    /**
     * Returns true if the user has a password stored in the database
     * That means, they are able to login with email and password
     */
    async userHasAuthCredential() {
        var _a, _b;
        const user = (_b = (_a = this.request) === null || _a === void 0 ? void 0 : _a.linkedAuth) === null || _b === void 0 ? void 0 : _b.user;
        if (!user) {
            console.warn('No user authenticated');
            return false;
        }
        return this.hasAuthCredential(user);
    }
    async hasAuthCredential(person) {
        const credential = await AuthCredential.select()
            .where((p) => p.credentialOf.equals(person))
            .one();
        return credential && true;
    }
    /**
     * Create a new password for the user
     *
     * @param password
     * @param user
     * @returns
     */
    async createNewCredential(email, password, user) {
        if (!password || !(typeof password === 'string')) {
            throw new Error('Password must be a string');
        }
        const passwordHash = await PasswordHelper.generateHashedPassword(password);
        const credential = await AuthCredential.create({
            credentialOf: user,
            email: email,
            passwordHash: passwordHash,
        });
        return credential;
    }
}
//# sourceMappingURL=AuthCredentialProvider.js.map