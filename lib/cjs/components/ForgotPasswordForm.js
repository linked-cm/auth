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
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const ForgotPasswordForm_module_css_1 = __importDefault(require("./ForgotPasswordForm.module.css"));
const TextField_1 = require("lincd-input/components/TextField");
const Button_1 = require("lincd-mui-base/components/Button");
const Hooks_1 = require("@_linked/react/utils/Hooks");
const Server_1 = require("@_linked/server-utils/utils/Server");
const package_js_1 = require("../package.js");
const react_2 = require("@tolgee/react");
function ForgotPasswordForm(_a) {
    var restProps = __rest(_a, []);
    const { register, handleSubmit, formState: { errors }, reset, setError, } = (0, react_hook_form_1.useForm)();
    const [helperText, setHelperText] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { t } = (0, react_2.useTranslate)();
    const prefix = 'resetPassword';
    const onResetPassword = (data) => {
        const { email } = data;
        setLoading(true);
        Server_1.Server.call(package_js_1.packageName, 'sendResetPasswordLink', email)
            .then((res) => {
            if (res) {
                if (res.error) {
                    setHelperText(res.error);
                }
                else {
                    setHelperText(`We\'ve sent you an email to ${email}. Please kindly check it to reset the password.`);
                }
            }
        })
            .catch((error) => {
            console.error(error);
        })
            .finally(() => {
            setLoading(false);
            reset();
        });
    };
    restProps = (0, Hooks_1.useStyles)(restProps, ForgotPasswordForm_module_css_1.default.root);
    return (react_1.default.createElement("form", Object.assign({}, restProps),
        react_1.default.createElement("h2", null, t(prefix + '.title', 'Reset Password')),
        react_1.default.createElement("div", { className: ForgotPasswordForm_module_css_1.default.FormGroup },
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'email' }, register('email', {
                required: t(prefix + '.emailRequired', 'Email field is required'),
            }), { placeholder: t(prefix + '.emailPlaceholder', 'Enter your valid email'), helperText: helperText })),
            errors.email && (react_1.default.createElement("p", { className: ForgotPasswordForm_module_css_1.default.ErrorMessage }, t(prefix + '.invalidEmailError', errors.email.message)))),
        react_1.default.createElement(Button_1.Button, { color: "primary", fullWidth: true, className: ForgotPasswordForm_module_css_1.default.FormButton, disabled: loading, onClick: handleSubmit(onResetPassword) }, loading
            ? t(prefix + '.sendingInstruction', 'Sending to your email...')
            : t(prefix + '.sendInstruction', 'Send me reset password instructions'))));
}
exports.default = ForgotPasswordForm;
//# sourceMappingURL=ForgotPasswordForm.js.map