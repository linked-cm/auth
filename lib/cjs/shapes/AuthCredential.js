"use strict";
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
const Shape_1 = require("@_linked/core/shapes/Shape");
const package_js_1 = require("../package.js");
const auth_js_1 = require("../ontologies/auth.js");
const Server_1 = require("@_linked/server-utils/utils/Server");
const Person_1 = require("@_linked/schema/shapes/Person");
const SHACL_1 = require("@_linked/core/shapes/SHACL");
let AuthCredential = class AuthCredential extends Shape_1.Shape {
    get credentialOf() {
        return undefined;
    }
    get email() {
        return '';
    }
    get forgotPasswordToken() {
        return '';
    }
    get passwordHash() {
        return '';
    }
    get telephone() {
        return '';
    }
    static userHasAuthCredential() {
        return Server_1.Server.call(this, 'userHasAuthCredential');
    }
    static hasAuthCredential(person) {
        return Server_1.Server.call(this, 'hasAuthCredential', person);
    }
    static createNewCredential(email, password, user) {
        return Server_1.Server.call(this, 'createNewCredential', email, password, user);
    }
};
exports.AuthCredential = AuthCredential;
AuthCredential.targetClass = auth_js_1.auth.AuthCredential;
__decorate([
    (0, SHACL_1.objectProperty)({
        path: auth_js_1.auth.credentialOf,
        shape: ['@_linked/schema', 'Person'],
        maxCount: 1,
    }),
    __metadata("design:type", Person_1.Person),
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
exports.AuthCredential = AuthCredential = __decorate([
    package_js_1.linkedShape
], AuthCredential);
//# sourceMappingURL=AuthCredential.js.map