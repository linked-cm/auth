"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webIDToTelephone = exports.telephoneToWebID = exports.webIDToEmail = exports.emailToWebID = void 0;
var WEBID_PREFIX = 'https://webid.create.now';
/**
 * The email is converted to a webID by adding the email to the end of the webID prefix.
 * e.g. test@example.com -> https://webid.create.now/test@example.com
 *
 * @param email - the email to convert to a webID
 * @returns the WebID string
 * @throws Error if email is empty or invalid
 */
var emailToWebID = function (email) {
    if (!email || typeof email !== 'string') {
        throw new Error('Email must be a non-empty string');
    }
    var trimmedEmail = email.trim();
    if (!trimmedEmail) {
        throw new Error('Email cannot be empty');
    }
    // Basic email validation (contains @ and at least one character before and after)
    if (!trimmedEmail.includes('@') ||
        trimmedEmail.indexOf('@') === 0 ||
        trimmedEmail.indexOf('@') === trimmedEmail.length - 1) {
        console.warn("Potentially invalid email format: ".concat(trimmedEmail));
    }
    // replace space with empty string to avoid invalid URI characters
    trimmedEmail = trimmedEmail.replace(/\s+/g, '');
    return "".concat(WEBID_PREFIX, "/").concat(trimmedEmail.toLowerCase());
};
exports.emailToWebID = emailToWebID;
/**
 * The webID is converted to an email by removing the webID prefix and converting the remaining string to lowercase.
 * e.g. https://webid.create.now/test@example.com -> test@example.com
 *
 * @param webID - the webID to convert to an email
 * @returns the email string, or null if the webID is not email-based or invalid
 */
var webIDToEmail = function (webID) {
    var match = webID.match(/^https:\/\/webid\.create\.now\/(.+)$/);
    if (match && match[1]) {
        var identifier = match[1].toLowerCase();
        // Verify it's actually an email (contains @)
        if (identifier.includes('@')) {
            return identifier;
        }
    }
    return null;
};
exports.webIDToEmail = webIDToEmail;
/**
 * The telephone number is converted to a webID by adding the telephone number to the end of the webID prefix.
 * e.g. +1234567890 -> https://webid.create.now/+1234567890
 *
 * @param telephone - the telephone number to convert to a webID
 * @returns the WebID string
 * @throws Error if telephone is empty or invalid
 */
var telephoneToWebID = function (telephone) {
    if (!telephone || typeof telephone !== 'string') {
        throw new Error('Telephone must be a non-empty string');
    }
    var trimmedTelephone = telephone.trim();
    if (!trimmedTelephone) {
        throw new Error('Telephone cannot be empty');
    }
    return "".concat(WEBID_PREFIX, "/").concat(trimmedTelephone.toLowerCase());
};
exports.telephoneToWebID = telephoneToWebID;
/**
 * The webID is converted to a telephone number by removing the webID prefix.
 * e.g. https://webid.create.now/+1234567890 -> +1234567890
 *
 * @param webID - the webID to convert to a telephone number
 * @returns the telephone string, or null if the webID is not telephone-based or invalid
 */
var webIDToTelephone = function (webID) {
    var match = webID.match(/^https:\/\/webid\.create\.now\/(.+)$/);
    if (match && match[1]) {
        var identifier = match[1];
        // Verify it's actually a telephone (doesn't contain @)
        if (!identifier.includes('@')) {
            return identifier;
        }
    }
    return null;
};
exports.webIDToTelephone = webIDToTelephone;
//# sourceMappingURL=webID.js.map