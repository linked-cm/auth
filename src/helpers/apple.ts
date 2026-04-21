import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const AppleHelper = {
  /**
   * Fetches the public key from Apple's authentication service.
   * @param kid Key ID of the public key to fetch.
   * @returns The public key associated with the provided Key ID.
   */
  async key(kid: string) {
    const client = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      timeout: 30000,
    });

    return await client.getSigningKey(kid);
  },

  /**
   * Decodes the provided identity token.
   * @param identityToken The identity token to decode.
   * @returns An object containing the email and subject from the decoded token.
   */
  async decodeIdentityToken(identityToken: string) {
    const { header } = jwt.decode(identityToken, { complete: true });
    const kid = header.kid;
    const publicKey = (await this.key(kid)).getPublicKey();
    const tokenLoad = jwt.verify(identityToken, publicKey);
    const email = tokenLoad['email'];
    const sub = tokenLoad.sub;

    return { email, sub };
  },
};

export default AppleHelper;
