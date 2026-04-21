var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Shape } from '@_linked/core/shapes/Shape';
import { linkedShape } from '../package.js';
import { auth } from '../ontologies/auth.js';
import { Server } from '@_linked/server-utils/utils/Server';
import { Person } from '@_linked/schema/shapes/Person';
import { literalProperty, objectProperty } from '@_linked/core/shapes/SHACL';
let AuthCredential = class AuthCredential extends Shape {
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
        return Server.call(this, 'userHasAuthCredential');
    }
    static hasAuthCredential(person) {
        return Server.call(this, 'hasAuthCredential', person);
    }
    static createNewCredential(email, password, user) {
        return Server.call(this, 'createNewCredential', email, password, user);
    }
};
AuthCredential.targetClass = auth.AuthCredential;
__decorate([
    objectProperty({
        path: auth.credentialOf,
        shape: ['@_linked/schema', 'Person'],
        maxCount: 1,
    }),
    __metadata("design:type", Person),
    __metadata("design:paramtypes", [])
], AuthCredential.prototype, "credentialOf", null);
__decorate([
    literalProperty({
        path: auth.email,
        required: false,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AuthCredential.prototype, "email", null);
__decorate([
    literalProperty({
        path: auth.forgotPasswordToken,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AuthCredential.prototype, "forgotPasswordToken", null);
__decorate([
    literalProperty({
        path: auth.passwordHash,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AuthCredential.prototype, "passwordHash", null);
__decorate([
    literalProperty({
        path: auth.telephone,
        required: false,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AuthCredential.prototype, "telephone", null);
AuthCredential = __decorate([
    linkedShape
], AuthCredential);
export { AuthCredential };
//# sourceMappingURL=AuthCredential.js.map