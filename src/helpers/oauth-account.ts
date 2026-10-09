import type { OAuthProvider } from '../types/auth.js';

/**
 * Providers whose email claim proves that the signer controls the address. Google and Apple
 * state it explicitly (`email_verified`, which their helpers require). Facebook's Graph API
 * returns an email without any verification flag, so a Facebook email never attaches an
 * identity to an account that already exists.
 */
export const EMAIL_VERIFYING_PROVIDERS: readonly OAuthProvider[] = ['google', 'apple'];

/**
 * The `action` of a sign-in refused because the email belongs to an account the provider
 * identity may not be attached to on its own. The user signs in the way they did before and
 * connects the provider from inside that session with `linkOAuthIdentity`.
 */
export const LINK_REQUIRES_SIGN_IN_ACTION = 'sign_in_to_link';

/** What `signinOAuth` knows about an existing account whose email matched. */
export type EmailMatchedAccountFacts = {
  /** The account's person has a stored password hash. */
  hasPassword: boolean;
  /** The providers that already have an identity linked to the account. */
  linkedProviders: OAuthProvider[];
};

/**
 * Decide whether a verified provider identity that matched NO linked identity may be attached,
 * by email, to an account that already exists.
 *
 * Attaching by email is where account takeover happens, so it is only allowed when nothing
 * about the existing account could belong to someone else:
 *
 * - the provider must vouch for the email (see {@link EMAIL_VERIFYING_PROVIDERS});
 * - the account must have no password. Account creation does not verify email ownership, so a
 *   password account may have been registered by somebody who typed in this address in advance
 *   and is waiting for the owner to arrive (pre-account hijacking);
 * - the account must not be connected to a provider whose email is not verified (same
 *   reasoning), nor to a different identity at this same provider.
 *
 * Everything else fails closed with `action: 'sign_in_to_link'`.
 */
export function decideEmailMatchedAccount(input: {
  provider: OAuthProvider;
  emailVerified: boolean;
  existing: EmailMatchedAccountFacts;
}): { link: true } | { error: string; action: string } {
  const refuse = (reason: string) => ({
    error:
      `An account with this email already exists${reason}. ` +
      `Sign in the way you did before, then connect ${input.provider} from your account.`,
    action: LINK_REQUIRES_SIGN_IN_ACTION,
  });

  if (!input.emailVerified || !EMAIL_VERIFYING_PROVIDERS.includes(input.provider)) {
    return refuse('');
  }
  if (input.existing.hasPassword) {
    return refuse(' and has a password');
  }
  if (input.existing.linkedProviders.includes(input.provider)) {
    return refuse(` and is connected to a different ${input.provider} account`);
  }
  if (
    input.existing.linkedProviders.some(
      (linked) => !EMAIL_VERIFYING_PROVIDERS.includes(linked)
    )
  ) {
    return refuse('');
  }
  return { link: true };
}

/**
 * The provider a stored identity link belongs to. Rows written before links recorded their
 * provider were only ever made by Apple sign-in, so a row with a subject and no provider is an
 * Apple link.
 */
export function providerOfIdentityLink(link: {
  identityProvider?: string | null;
  sub?: string | null;
}): OAuthProvider | undefined {
  const provider = link?.identityProvider;
  if (provider === 'google' || provider === 'apple' || provider === 'facebook') {
    return provider;
  }
  if (provider) return undefined;
  return link?.sub ? 'apple' : undefined;
}
