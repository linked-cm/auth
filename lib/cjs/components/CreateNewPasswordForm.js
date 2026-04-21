"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNewPasswordForm = void 0;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const CreateNewPasswordForm_module_css_1 = __importDefault(require("./CreateNewPasswordForm.module.css"));
const TextField_1 = require("lincd-input/components/TextField");
const Button_1 = require("lincd-mui-base/components/Button");
const Hooks_1 = require("@_linked/react/utils/Hooks");
const Server_1 = require("@_linked/server-utils/utils/Server");
const package_js_1 = require("../package.js");
const useAuth_js_1 = require("../hooks/useAuth.js");
const dialog_1 = require("@capacitor/dialog");
function CreateNewPasswordForm(_a) {
    var _b, _c;
    var { token, onPasswordIsReset } = _a, restProps = __rest(_a, ["token", "onPasswordIsReset"]);
    const { register, handleSubmit, getValues, watch, formState: { errors }, } = (0, react_hook_form_1.useForm)();
    const auth = (0, useAuth_js_1.useAuth)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const resetPassword = (_d) => __awaiter(this, [_d], void 0, function* ({ password, confirmPassword, }) {
        try {
            setLoading(true);
            const res = yield Server_1.Server.call(package_js_1.packageName, 'resetPassword', password, confirmPassword, token);
            if (res.auth && onPasswordIsReset) {
                auth.updateAuth({
                    auth: res.auth,
                    accessToken: res.accessToken,
                    refreshToken: res.refreshToken,
                });
                onPasswordIsReset();
            }
        }
        catch (error) {
            console.error('Error resetting password:', error);
            yield dialog_1.Dialog.alert({
                title: 'Something went wrong',
                message: 'Failed to reset password. Please try again or contact support.',
            });
        }
        finally {
            setLoading(false);
        }
    });
    restProps = (0, Hooks_1.useStyles)(restProps, CreateNewPasswordForm_module_css_1.default.root);
    // disable button if any error or password not matches or fields are empty
    const password = watch('password');
    const confirmPassword = watch('confirmPassword');
    const isDisabled = !!errors.password ||
        !!errors.confirmPassword ||
        !password ||
        !confirmPassword ||
        confirmPassword !== password ||
        loading;
    return (react_1.default.createElement("div", Object.assign({}, restProps),
        react_1.default.createElement("form", null,
            react_1.default.createElement("h2", null, "Set A New Password"),
            react_1.default.createElement("div", { className: CreateNewPasswordForm_module_css_1.default.FormGroup },
                react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'password', placeholder: "Enter new password", onBlur: () => { } }, register('password', {
                    required: true,
                    minLength: 6,
                }))),
                ((_b = errors === null || errors === void 0 ? void 0 : errors.password) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password is required")),
                ((_c = errors === null || errors === void 0 ? void 0 : errors.password) === null || _c === void 0 ? void 0 : _c.type) === 'minLength' && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password cannot less than 6 characters")),
                react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'password', placeholder: "Confirm your password", onBlur: () => { } }, register('confirmPassword', {
                    required: true,
                }))),
                (errors === null || errors === void 0 ? void 0 : errors.confirmPassword) && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Confirm password is required")),
                confirmPassword !== password && confirmPassword ? (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password did not match")) : null),
            react_1.default.createElement(Button_1.Button, { color: "primary", fullWidth: true, disabled: isDisabled, onClick: handleSubmit(resetPassword) }, loading ? 'Saving...' : 'Save'))));
}
exports.CreateNewPasswordForm = CreateNewPasswordForm;
exports.default = CreateNewPasswordForm;
//# sourceMappingURL=CreateNewPasswordForm.js.map