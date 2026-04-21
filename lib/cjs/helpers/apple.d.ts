import jwksClient from 'jwks-rsa';
declare const AppleHelper: {
    /**
     * Fetches the public key from Apple's authentication service.
     * @param kid Key ID of the public key to fetch.
     * @returns The public key associated with the provided Key ID.
     */
    key(kid: string): Promise<jwksClient.SigningKey>;
    /**
     * Decodes the provided identity token.
     * @param identityToken The identity token to decode.
     * @returns An object containing the email and subject from the decoded token.
     */
    decodeIdentityToken(identityToken: string): Promise<{
        email: any;
        sub: string | (() => string);
    }>;
};
export default AppleHelper;
