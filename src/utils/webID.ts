const WEBID_PREFIX = 'https://webid.create.now';

/**
 * The email is converted to a webID by adding the email to the end of the webID prefix.
 * e.g. test@example.com -> https://webid.create.now/test@example.com
 *
 * @param email - the email to convert to a webID
 * @returns the WebID string
 * @throws Error if email is empty or invalid
 */
export const emailToWebID = (email: string): string => {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  let trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error('Email cannot be empty');
  }

  // Basic email validation (contains @ and at least one character before and after)
  if (
    !trimmedEmail.includes('@') ||
    trimmedEmail.indexOf('@') === 0 ||
    trimmedEmail.indexOf('@') === trimmedEmail.length - 1
  ) {
    console.warn(`Potentially invalid email format: ${trimmedEmail}`);
  }

  // replace space with empty string to avoid invalid URI characters
  trimmedEmail = trimmedEmail.replace(/\s+/g, '');

  return `${WEBID_PREFIX}/${trimmedEmail.toLowerCase()}`;
};

/**
 * The webID is converted to an email by removing the webID prefix and converting the remaining string to lowercase.
 * e.g. https://webid.create.now/test@example.com -> test@example.com
 *
 * @param webID - the webID to convert to an email
 * @returns the email string, or null if the webID is not email-based or invalid
 */
export const webIDToEmail = (webID: string): string | null => {
  const match = webID.match(/^https:\/\/webid\.create\.now\/(.+)$/);
  if (match && match[1]) {
    const identifier = match[1].toLowerCase();
    // Verify it's actually an email (contains @)
    if (identifier.includes('@')) {
      return identifier;
    }
  }
  return null;
};

/**
 * The telephone number is converted to a webID by adding the telephone number to the end of the webID prefix.
 * e.g. +1234567890 -> https://webid.create.now/+1234567890
 *
 * @param telephone - the telephone number to convert to a webID
 * @returns the WebID string
 * @throws Error if telephone is empty or invalid
 */
export const telephoneToWebID = (telephone: string): string => {
  if (!telephone || typeof telephone !== 'string') {
    throw new Error('Telephone must be a non-empty string');
  }

  const trimmedTelephone = telephone.trim();
  if (!trimmedTelephone) {
    throw new Error('Telephone cannot be empty');
  }

  return `${WEBID_PREFIX}/${trimmedTelephone.toLowerCase()}`;
};

/**
 * The webID is converted to a telephone number by removing the webID prefix.
 * e.g. https://webid.create.now/+1234567890 -> +1234567890
 *
 * @param webID - the webID to convert to a telephone number
 * @returns the telephone string, or null if the webID is not telephone-based or invalid
 */
export const webIDToTelephone = (webID: string): string | null => {
  const match = webID.match(/^https:\/\/webid\.create\.now\/(.+)$/);
  if (match && match[1]) {
    const identifier = match[1];
    // Verify it's actually a telephone (doesn't contain @)
    if (!identifier.includes('@')) {
      return identifier;
    }
  }
  return null;
};
