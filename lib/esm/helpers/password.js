import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthCredential } from '../shapes/AuthCredential.js';
/**
 * PasswordHelper
 */
const PasswordHelper = {
    /**
     * generate a hashed password
     *
     * @param plainTextPassword
     * @returns
     */
    async generateHashedPassword(plainTextPassword) {
        try {
            const saltRounds = 3; // Generate a salt (a random value to add to the password before hashing)
            const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
            return hashedPassword;
        }
        catch (error) {
            throw error;
        }
    },
    /**
     * generate a new token
     *
     * @returns
     */
    generateToken() {
        // before use this function to generate a new token, for now we change it to use crypto.randomBytes
        // const newToken = URL.createObjectURL(new Blob([])).slice(-36).replace(/-/g, '');
        return crypto.randomBytes(20).toString('hex');
    },
    /**
     * Compare the entered password with the hashed password
     *
     * @param enteredPassword
     * @param hashedPassword
     * @returns
     */
    async checkPassword(enteredPassword, hashedPassword) {
        const comparedPassword = await bcrypt
            .compare(enteredPassword, hashedPassword)
            .catch((err) => {
            console.error('This email and password combination is incorrect');
            return false;
        });
        return comparedPassword;
    },
    /**
     * Validate the reset password token
     *
     * @param token - The reset password token
     * @returns
     */
    async validateResetPasswordToken(token) {
        //check if there is ANY password with this token. If yes, return the userAccount.
        const password = await AuthCredential.select((cred) => cred.credentialOf)
            .where((cred) => {
            return cred.forgotPasswordToken.equals(token);
        })
            .one();
        return password === null || password === void 0 ? void 0 : password.credentialOf;
    },
};
export default PasswordHelper;
//# sourceMappingURL=password.js.map