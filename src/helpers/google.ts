import { OAuth2Client } from 'google-auth-library';

const GoogleHelper = {
  /**
   * Validate Google ID token using Google Auth Library
   *
   * @param idToken - The Google ID token to validate
   * @returns Promise<GoogleTokenPayload | null> - The validated token payload or null if invalid
   */
  async validateIdToken(idToken: string): Promise<any | null> {
    try {
      const client = new OAuth2Client();

      // get the Google Client IDs from environment variables
      // we need to support multiple client IDs: web, iOS, and Android
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientIdIos = process.env.GOOGLE_CLIENT_ID_IOS;
      const googleClientIdAndroid = process.env.GOOGLE_CLIENT_ID_ANDROID;

      // build array of valid audience values
      const audiences = [
        googleClientId,
        googleClientIdIos,
        googleClientIdAndroid,
      ].filter(Boolean);

      if (audiences.length === 0) {
        console.error(
          'No Google Client IDs configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_IOS, or GOOGLE_CLIENT_ID_ANDROID'
        );
        return null;
      }

      console.log(
        'Validating Google ID token against audiences:',
        audiences.map((id) => id?.substring(0, 20) + '...')
      );

      // verify the ID token with multiple audiences
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: audiences, // accept web, iOS, and Android client IDs
      });

      const payload = ticket.getPayload();

      if (!payload) {
        console.error('Google ID token payload is null');
        return null;
      }

      // Validate required fields
      if (!payload.sub) {
        console.error('Google ID token missing sub field');
        return null;
      }

      if (!payload.email) {
        console.error('Google ID token missing email field');
        return null;
      }

      // Check if email is verified
      if (!payload.email_verified) {
        console.error('Google ID token email is not verified');
        return null;
      }

      console.log(
        'Google ID token validated successfully for user:',
        payload.sub
      );
      return payload;
    } catch (error) {
      console.error('Error validating Google ID token:', error);
      return null;
    }
  },
};

export default GoogleHelper;
