"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ForgotPasswordCallback;
var react_1 = __importDefault(require("react"));
var react_router_dom_1 = require("react-router-dom");
var CreateNewPasswordForm_js_1 = __importDefault(require("./CreateNewPasswordForm.js"));
function ForgotPasswordCallback(_a) {
    var onPasswordIsReset = _a.onPasswordIsReset;
    var _b = __read((0, react_router_dom_1.useSearchParams)(), 1), searchParams = _b[0];
    var token = searchParams.get('token');
    return (react_1.default.createElement(CreateNewPasswordForm_js_1.default, { token: token, onPasswordIsReset: onPasswordIsReset }));
}
//# sourceMappingURL=ForgotPasswordCallback.js.map