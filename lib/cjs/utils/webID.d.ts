/**
 * The email is converted to a webID by adding the email to the end of the webID prefix.
 * e.g. test@example.com -> https://webid.create.now/test@example.com
 *
 * @param email - the email to convert to a webID
 * @returns the WebID string
 * @throws Error if email is empty or invalid
 */
export declare const emailToWebID: (email: string) => string;
/**
 * The webID is converted to an email by removing the webID prefix and converting the remaining string to lowercase.
 * e.g. https://webid.create.now/test@example.com -> test@example.com
 *
 * @param webID - the webID to convert to an email
 * @returns the email string, or null if the webID is not email-based or invalid
 */
export declare const webIDToEmail: (webID: string) => string | null;
/**
 * The telephone number is converted to a webID by adding the telephone number to the end of the webID prefix.
 * e.g. +1234567890 -> https://webid.create.now/+1234567890
 *
 * @param telephone - the telephone number to convert to a webID
 * @returns the WebID string
 * @throws Error if telephone is empty or invalid
 */
export declare const telephoneToWebID: (telephone: string) => string;
/**
 * The webID is converted to a telephone number by removing the webID prefix.
 * e.g. https://webid.create.now/+1234567890 -> +1234567890
 *
 * @param webID - the webID to convert to a telephone number
 * @returns the telephone string, or null if the webID is not telephone-based or invalid
 */
export declare const webIDToTelephone: (webID: string) => string | null;
