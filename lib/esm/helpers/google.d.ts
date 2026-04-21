declare const GoogleHelper: {
    /**
     * Validate Google ID token using Google Auth Library
     *
     * @param idToken - The Google ID token to validate
     * @returns Promise<GoogleTokenPayload | null> - The validated token payload or null if invalid
     */
    validateIdToken(idToken: string): Promise<any | null>;
};
export default GoogleHelper;
