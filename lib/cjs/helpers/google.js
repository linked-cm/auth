"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const google_auth_library_1 = require("google-auth-library");
const GoogleHelper = {
    /**
     * Validate Google ID token using Google Auth Library
     *
     * @param idToken - The Google ID token to validate
     * @returns Promise<GoogleTokenPayload | null> - The validated token payload or null if invalid
     */
    validateIdToken(idToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = new google_auth_library_1.OAuth2Client();
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
                    console.error('No Google Client IDs configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_IOS, or GOOGLE_CLIENT_ID_ANDROID');
                    return null;
                }
                console.log('Validating Google ID token against audiences:', audiences.map((id) => (id === null || id === void 0 ? void 0 : id.substring(0, 20)) + '...'));
                // verify the ID token with multiple audiences
                const ticket = yield client.verifyIdToken({
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
                console.log('Google ID token validated successfully for user:', payload.sub);
                return payload;
            }
            catch (error) {
                console.error('Error validating Google ID token:', error);
                return null;
            }
        });
    },
};
exports.default = GoogleHelper;
//# sourceMappingURL=google.js.map