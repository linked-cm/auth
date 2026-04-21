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
exports.CreateAccountForm = void 0;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const CreateAccountForm_module_css_1 = __importDefault(require("./CreateAccountForm.module.css"));
const TextField_1 = require("lincd-input/components/TextField");
const Button_1 = require("lincd-mui-base/components/Button");
const Hooks_1 = require("@_linked/react/utils/Hooks");
const Server_1 = require("@_linked/server-utils/utils/Server");
const package_js_1 = require("../package.js");
const useAuth_js_1 = require("../hooks/useAuth.js");
const react_2 = require("@tolgee/react");
function CreateAccountForm(_a) {
    var _b, _c;
    var { onAccountCreated } = _a, restProps = __rest(_a, ["onAccountCreated"]);
    const { register, handleSubmit, getValues, watch, formState: { errors }, } = (0, react_hook_form_1.useForm)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [submitFeedback, setSubmitFeedback] = (0, react_1.useState)('');
    const [isAlertClosed, setIsAlertClosed] = (0, react_1.useState)(false);
    const auth = (0, useAuth_js_1.useAuth)();
    const { t } = (0, react_2.useTranslate)();
    const prefix = 'createAccount';
    const createAccount = (data) => {
        //validation for password and confirmPassword
        if (watch('password') !== watch('confirmPassword')) {
            return;
        }
        //  set email to lowercase, before sending to server
        data.email = data.email.toLowerCase();
        setLoading(true);
        Server_1.Server.call(package_js_1.packageName, 'createAccount', data).then((response) => {
            console.log('createAccount response', response);
            if (response === null || response === void 0 ? void 0 : response.auth) {
                //update local auth
                const result = auth.updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                });
                if (onAccountCreated) {
                    onAccountCreated(result);
                }
            }
            if (!response) {
                setSubmitFeedback('Something went wrong. Please contact support');
            }
            if (response && response.error) {
                setSubmitFeedback(response.error);
            }
            setLoading(false);
        });
    };
    const closeAlert = () => {
        setIsAlertClosed(true);
        setSubmitFeedback('');
        setTimeout(() => {
            setIsAlertClosed(false);
        }, 500);
    };
    restProps = (0, Hooks_1.useStyles)(restProps, CreateAccountForm_module_css_1.default.root);
    return (react_1.default.createElement("form", Object.assign({}, restProps),
        react_1.default.createElement("h2", null, t(prefix + '.title', 'Create Account')),
        submitFeedback && !isAlertClosed ? (react_1.default.createElement("div", { className: CreateAccountForm_module_css_1.default.Alert },
            react_1.default.createElement("p", null, submitFeedback),
            react_1.default.createElement("span", { className: CreateAccountForm_module_css_1.default.CloseBtn, onClick: closeAlert }, "\u2716"))) : null,
        react_1.default.createElement("div", { className: CreateAccountForm_module_css_1.default.FormGroup },
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'text', placeholder: t(prefix + '.firstNamePlaceholder', 'Enter your first name') }, register('firstName', { required: true }))),
            errors.firstName && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.firstNameError', 'First name is required'))),
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'text', placeholder: t(prefix + '.lastNamePlaceholder', 'Enter your last name') }, register('lastName'))),
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'email', placeholder: t(prefix + '.emailPlaceholder', 'Enter your email') }, register('email', { required: true }))),
            errors.email && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.emailError', 'Email is required'))),
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'email', placeholder: t(prefix + '.emailConfirmationPlaceholder', 'Confirm your email') }, register('confirmEmail', {
                required: true,
            }))),
            (errors === null || errors === void 0 ? void 0 : errors.confirmEmail) && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.', 'Confirm email is required'))),
            watch('confirmEmail') !== watch('email') &&
                getValues('confirmEmail') ? (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.unmatchedEmailError', 'Email did not match'))) : null,
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'password', placeholder: t(prefix + '.passwordPlaceholder', 'Enter your password') }, register('password', { required: true, minLength: 6 }))),
            ((_b = errors === null || errors === void 0 ? void 0 : errors.password) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.passwordError', 'Password is required'))),
            ((_c = errors === null || errors === void 0 ? void 0 : errors.password) === null || _c === void 0 ? void 0 : _c.type) === 'minLength' && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.passwordLengthError', 'Password cannot less than 6 characters'))),
            react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'password', placeholder: t(prefix + '.passwordConfirmationPlaceholder', 'Confirm your password') }, register('confirmPassword', {
                required: true,
            }))),
            (errors === null || errors === void 0 ? void 0 : errors.confirmPassword) && (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.passwordConfirmationError', 'Confirm password is required'))),
            watch('confirmPassword') !== watch('password') &&
                getValues('confirmPassword') ? (react_1.default.createElement("p", { className: CreateAccountForm_module_css_1.default.ErrorMessage }, t(prefix + '.unmatchedPasswordError', 'Password did not match'))) : null),
        react_1.default.createElement(Button_1.Button, { color: "primary", fullWidth: true, className: CreateAccountForm_module_css_1.default.FormButton, disabled: loading, onClick: handleSubmit(createAccount) }, loading
            ? t(prefix + '.loadingCreateAccountButton', 'Creating your account...')
            : t(prefix + '.createAccountButton', 'Create Account'))));
}
exports.CreateAccountForm = CreateAccountForm;
exports.default = CreateAccountForm;
//# sourceMappingURL=CreateAccountForm.js.map