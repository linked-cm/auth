"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const CreateNewPasswordForm_js_1 = __importDefault(require("./CreateNewPasswordForm.js"));
function ForgotPasswordCallback({ onPasswordIsReset }) {
    const [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const token = searchParams.get('token');
    return (react_1.default.createElement(CreateNewPasswordForm_js_1.default, { token: token, onPasswordIsReset: onPasswordIsReset }));
}
exports.default = ForgotPasswordCallback;
//# sourceMappingURL=ForgotPasswordCallback.js.map