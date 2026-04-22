"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
exports.RefreshToken = void 0;
var Shape_1 = require("@_linked/core/shapes/Shape");
var package_js_1 = require("../package.js");
var auth_js_1 = require("../ontologies/auth.js");
var UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
var SHACL_1 = require("@_linked/core/shapes/SHACL");
var RefreshToken = /** @class */ (function (_super) {
    __extends(RefreshToken, _super);
    function RefreshToken() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RefreshToken_1 = RefreshToken;
    Object.defineProperty(RefreshToken.prototype, "token", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RefreshToken.prototype, "account", {
        get: function () {
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Remove the token from the database
     *
     * @param token The token to remove
     * @returns True if the token was removed, false if it was not found
     */
    RefreshToken.removeRefreshToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var existingToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!token) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, RefreshToken_1.select(function (t) { return [t.token, t.account]; })
                                .where(function (t) { return t.token.equals(token); })
                                .one()];
                    case 1:
                        existingToken = _a.sent();
                        if (!existingToken) return [3 /*break*/, 3];
                        return [4 /*yield*/, RefreshToken_1.delete(existingToken)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Get the refresh token for an account
     *
     * @param account
     * @returns
     */
    RefreshToken.getRefreshTokenForAccount = function (account) {
        return __awaiter(this, void 0, void 0, function () {
            var existingToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, RefreshToken_1.select(function (t) { return [t.token, t.account]; })
                            .where(function (t) { return t.account.equals(account); })
                            .one()];
                    case 1:
                        existingToken = _a.sent();
                        return [2 /*return*/, existingToken];
                }
            });
        });
    };
    var RefreshToken_1;
    RefreshToken.targetClass = auth_js_1.auth.RefreshToken;
    __decorate([
        (0, SHACL_1.literalProperty)({
            path: auth_js_1.auth.token,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [])
    ], RefreshToken.prototype, "token", null);
    __decorate([
        (0, SHACL_1.objectProperty)({
            path: auth_js_1.auth.account,
            shape: ['lincd-sioc', 'UserAccount'],
            maxCount: 1,
        }),
        __metadata("design:type", UserAccount_1.UserAccount),
        __metadata("design:paramtypes", [])
    ], RefreshToken.prototype, "account", null);
    RefreshToken = RefreshToken_1 = __decorate([
        package_js_1.linkedShape
    ], RefreshToken);
    return RefreshToken;
}(Shape_1.Shape));
exports.RefreshToken = RefreshToken;
//# sourceMappingURL=RefreshToken.js.map