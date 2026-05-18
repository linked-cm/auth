import { v5 as uuidv5 } from 'uuid';

const WEBID_PREFIX = 'https://webid.email/id';

/**
 * Public namespace UUID for the webid.email WebID scheme.
 * Used as the UUID v5 namespace when deriving a WebID from an email address.
 * This value is fixed and published — both CN and the webid.email service use it.
 * Do NOT change this value; doing so would invalidate all existing WebID URIs.
 */
export const WEBID_EMAIL_NAMESPACE = 'f498d4c9-555c-4ebb-9b4b-b6e16910f84c';

/**
 * Derives a deterministic, non-reversible WebID URI from an email address.
 *
 * Algorithm: UUID v5 (SHA-1, RFC 4122) using WEBID_EMAIL_NAMESPACE as the namespace
 * and the normalized (trimmed, lowercased) email as the name.
 *
 * The algorithm is public. Knowing the WebID does not reveal the email address.
 * Both CN (dev mode) and the webid.email service (production) use the same algorithm,
 * so WebIDs are identical across environments.
 *
 * e.g. alice@example.com -> https://webid.email/id/550e8400-e29b-41d4-a716-...
 */
export const emailToWebID = (email: string): string => {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    !normalizedEmail ||
    !normalizedEmail.includes('@') ||
    normalizedEmail.indexOf('@') === 0 ||
    normalizedEmail.indexOf('@') === normalizedEmail.length - 1
  ) {
    console.warn(`Potentially invalid email format: ${normalizedEmail}`);
  }

  return `${WEBID_PREFIX}/${uuidv5(normalizedEmail, WEBID_EMAIL_NAMESPACE)}`;
};

/**
 * @deprecated WebIDs are now opaque UUID v5 values — reversing a WebID to an email
 * is no longer possible. Replace all callers with a UserAccount.email query:
 *   const account = await UserAccount.select(a => [a.email]).where(a => a.accountOf.equals({ id: webID })).one();
 *   const email = account?.email;
 *
 * This stub returns null unconditionally so callers fail visibly rather than silently.
 */
export const webIDToEmail = (_webID: string): string | null => {
  return null;
};

// telephoneToWebID and webIDToTelephone removed — phone-based WebIDs are out of scope for v1.
