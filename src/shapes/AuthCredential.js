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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthCredential = void 0;
var Shape_1 = require("@_linked/core/shapes/Shape");
var package_js_1 = require("../package.js");
var auth_js_1 = require("../ontologies/auth.js");
var Server_1 = require("@_linked/server-utils/utils/Server");
var Person_1 = require("@_linked/schema/shapes/Person");
var SHACL_1 = require("@_linked/core/shapes/SHACL");
var AuthCredential = /** @class */ (function (_super) {
    __extends(AuthCredential, _super);
    function AuthCredential() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(AuthCredential.prototype, "credentialOf", {
        get: function () {
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthCredential.prototype, "email", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthCredential.prototype, "forgotPasswordToken", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthCredential.prototype, "passwordHash", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AuthCredential.prototype, "telephone", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
    AuthCredential.userHasAuthCredential = function () {
        return Server_1.Server.call(this, 'userHasAuthCredential');
    };
    AuthCredential.hasAuthCredential = function (person) {
        return Server_1.Server.call(this, 'hasAuthCredential', person);
    };
    AuthCredential.createNewCredential = function (email, password, user) {
        return Server_1.Server.call(this, 'createNewCredential', email, password, user);
    };
    var _a;
    AuthCredential.targetClass = auth_js_1.auth.AuthCredential;
    __decorate([
        (0, SHACL_1.objectProperty)({
            path: auth_js_1.auth.credentialOf,
            shape: ['@_linked/schema', 'Person'],
            maxCount: 1,
        }),
        __metadata("design:type", typeof (_a = typeof Person_1.Person !== "undefined" && Person_1.Person) === "function" ? _a : Object),
        __metadata("design:paramtypes", [])
    ], AuthCredential.prototype, "credentialOf", null);
    __decorate([
        (0, SHACL_1.literalProperty)({
            path: auth_js_1.auth.email,
            required: false,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [])
    ], AuthCredential.prototype, "email", null);
    __decorate([
        (0, SHACL_1.literalProperty)({
            path: auth_js_1.auth.forgotPasswordToken,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [])
    ], AuthCredential.prototype, "forgotPasswordToken", null);
    __decorate([
        (0, SHACL_1.literalProperty)({
            path: auth_js_1.auth.passwordHash,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [])
    ], AuthCredential.prototype, "passwordHash", null);
    __decorate([
        (0, SHACL_1.literalProperty)({
            path: auth_js_1.auth.telephone,
            required: false,
            maxCount: 1,
        }),
        __metadata("design:type", String),
        __metadata("design:paramtypes", [])
    ], AuthCredential.prototype, "telephone", null);
    AuthCredential = __decorate([
        package_js_1.linkedShape
    ], AuthCredential);
    return AuthCredential;
}(Shape_1.Shape));
exports.AuthCredential = AuthCredential;
//# sourceMappingURL=AuthCredential.js.map