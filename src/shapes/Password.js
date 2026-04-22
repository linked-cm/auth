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
exports.Password = void 0;
var Shape_1 = require("@_linked/core/shapes/Shape");
var package_js_1 = require("../package.js");
var auth_js_1 = require("../ontologies/auth.js");
var SHACL_1 = require("@_linked/core/shapes/SHACL");
var UserAccount_1 = require("lincd-sioc/shapes/UserAccount");
// NOTE: after migration to new authentication system, this shape is not used anymore
var Password = /** @class */ (function (_super) {
    __extends(Password, _super);
    function Password() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(Password.prototype, "account", {
        get: function () {
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Password.prototype, "hash", {
        get: function () {
            return '';
        },
        enumerable: false,
        configurable: true
    });
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
    Password = __decorate([
        package_js_1.linkedShape
    ], Password);
    return Password;
}(Shape_1.Shape));
exports.Password = Password;
//# sourceMappingURL=Password.js.map