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
import { literalProperty, objectProperty } from '@_linked/core/shapes/SHACL';
import { UserAccount } from 'lincd-sioc/shapes/UserAccount';
// NOTE: after migration to new authentication system, this shape is not used anymore
let Password = class Password extends Shape {
    get account() {
        return undefined;
    }
    get hash() {
        return '';
    }
};
Password.targetClass = auth.Password;
__decorate([
    objectProperty({
        path: auth.account,
        shape: ['lincd-sioc', 'UserAccount'],
        maxCount: 1,
    }),
    __metadata("design:type", UserAccount),
    __metadata("design:paramtypes", [])
], Password.prototype, "account", null);
__decorate([
    literalProperty({
        path: auth.hash,
        maxCount: 1,
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Password.prototype, "hash", null);
Password = __decorate([
    linkedShape
], Password);
export { Password };
//# sourceMappingURL=Password.js.map