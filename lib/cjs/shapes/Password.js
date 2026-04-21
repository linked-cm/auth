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
exports.Password = void 0;
const Shape_1 = require("@_linked/core/shapes/Shape");
const package_js_1 = require("../package.js");
const auth_js_1 = require("../ontologies/auth.js");
const SHACL_1 = require("@_linked/core/shapes/SHACL");
const UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
// NOTE: after migration to new authentication system, this shape is not used anymore
let Password = class Password extends Shape_1.Shape {
    get account() {
        return undefined;
    }
    get hash() {
        return '';
    }
};
exports.Password = Password;
Password.targetClass = auth_js_1.auth.Password;
__decorate([
    (0, SHACL_1.objectProperty)({
        path: auth_js_1.auth.account,
        shape: ['lincd-sioc', 'UserAccount'],
        maxCount: 1,
    }),
    __metadata("design:type", UserAccount_1.UserAccount),
    __metadata("design:paramtypes", [])
], Password.prototype, "account", null);
__decorate([
    (0, SHACL_1.literalProperty)({
        path: auth_js_1.auth.hash,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Password.prototype, "hash", null);
exports.Password = Password = __decorate([
    package_js_1.linkedShape
], Password);
//# sourceMappingURL=Password.js.map