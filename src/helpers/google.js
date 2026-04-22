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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var google_auth_library_1 = require("google-auth-library");
var GoogleHelper = {
    /**
     * Validate Google ID token using Google Auth Library
     *
     * @param idToken - The Google ID token to validate
     * @returns Promise<GoogleTokenPayload | null> - The validated token payload or null if invalid
     */
    validateIdToken: function (idToken) {
        return __awaiter(this, void 0, void 0, function () {
            var client, googleClientId, googleClientIdIos, googleClientIdAndroid, audiences, ticket, payload, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        client = new google_auth_library_1.OAuth2Client();
                        googleClientId = process.env.GOOGLE_CLIENT_ID;
                        googleClientIdIos = process.env.GOOGLE_CLIENT_ID_IOS;
                        googleClientIdAndroid = process.env.GOOGLE_CLIENT_ID_ANDROID;
                        audiences = [
                            googleClientId,
                            googleClientIdIos,
                            googleClientIdAndroid,
                        ].filter(Boolean);
                        if (audiences.length === 0) {
                            console.error('No Google Client IDs configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_IOS, or GOOGLE_CLIENT_ID_ANDROID');
                            return [2 /*return*/, null];
                        }
                        console.log('Validating Google ID token against audiences:', audiences.map(function (id) { return (id === null || id === void 0 ? void 0 : id.substring(0, 20)) + '...'; }));
                        return [4 /*yield*/, client.verifyIdToken({
                                idToken: idToken,
                                audience: audiences, // accept web, iOS, and Android client IDs
                            })];
                    case 1:
                        ticket = _a.sent();
                        payload = ticket.getPayload();
                        if (!payload) {
                            console.error('Google ID token payload is null');
                            return [2 /*return*/, null];
                        }
                        // Validate required fields
                        if (!payload.sub) {
                            console.error('Google ID token missing sub field');
                            return [2 /*return*/, null];
                        }
                        if (!payload.email) {
                            console.error('Google ID token missing email field');
                            return [2 /*return*/, null];
                        }
                        // Check if email is verified
                        if (!payload.email_verified) {
                            console.error('Google ID token email is not verified');
                            return [2 /*return*/, null];
                        }
                        console.log('Google ID token validated successfully for user:', payload.sub);
                        return [2 /*return*/, payload];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error validating Google ID token:', error_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
};
exports.default = GoogleHelper;
//# sourceMappingURL=google.js.map