import { Person } from '@_linked/schema/shapes/Person';
import { QResult } from '@_linked/core/queries/SelectQuery';
/**
 * PasswordHelper
 */
declare const PasswordHelper: {
    /**
     * generate a hashed password
     *
     * @param plainTextPassword
     * @returns
     */
    generateHashedPassword(plainTextPassword: string): Promise<string>;
    /**
     * generate a new token
     *
     * @returns
     */
    generateToken(): string;
    /**
     * Compare the entered password with the hashed password
     *
     * @param enteredPassword
     * @param hashedPassword
     * @returns
     */
    checkPassword(enteredPassword: string, hashedPassword: string): Promise<boolean>;
    /**
     * Validate the reset password token
     *
     * @param token - The reset password token
     * @returns
     */
    validateResetPasswordToken(token: string): Promise<QResult<Person>>;
};
export default PasswordHelper;
