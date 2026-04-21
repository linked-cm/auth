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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SigninWithPasswordForm = void 0;
const react_1 = __importStar(require("react"));
const react_hook_form_1 = require("react-hook-form");
const SigninWithPasswordForm_module_css_1 = __importDefault(require("./SigninWithPasswordForm.module.css"));
const TextField_1 = require("lincd-input/components/TextField");
const Modal_1 = require("lincd-mui-base/components/Modal");
const CreateAccountForm_js_1 = __importDefault(require("./CreateAccountForm.js"));
const ForgotPasswordForm_js_1 = __importDefault(require("./ForgotPasswordForm.js"));
const useAuth_js_1 = require("../hooks/useAuth.js");
const ClassNames_1 = require("@_linked/react/utils/ClassNames");
const Server_1 = require("@_linked/server-utils/utils/Server");
const Button_1 = require("lincd-mui-base/components/Button");
const package_js_1 = require("../package.js");
const react_router_dom_1 = require("react-router-dom");
const LinkedFileStorage_1 = require("@_linked/core/utils/LinkedFileStorage");
const react_2 = require("@tolgee/react");
const SigninWithPasswordForm = ({ onCreateAccount, onLoggedIn, className, onLoginFailed, startWithInputField, onForgotPassword, showEmailIcon, buttonClassName, onLoadingChange, // callback function invoked when the loading state changes, you can pass a function to handle the loading state when call the server
 }) => {
    const { register, handleSubmit, formState: { errors }, trigger, watch, reset, resetField, getValues, } = (0, react_hook_form_1.useForm)({ mode: 'all' });
    const [formIsHidden, setFormIsHidden] = (0, react_1.useState)(false);
    const [showInputField, setShowInputField] = (0, react_1.useState)(startWithInputField || false);
    const [showCreateAccountModal, setShowCreateAccountModal] = (0, react_1.useState)(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = (0, react_1.useState)(false);
    const auth = (0, useAuth_js_1.useAuth)();
    const [searchParam] = (0, react_router_dom_1.useSearchParams)();
    const { t } = (0, react_2.useTranslate)();
    let prefix = 'signIn';
    const adminLogin = () => {
        return Server_1.Server.call(package_js_1.packageName, 'signinDevelopment', searchParam.get('email')).then((response) => {
            // if (response.auth) {
            //   const result = auth.updateAuth(
            //     response.auth,
            //     response.accessToken,
            //     response.refreshToken,
            //   );
            //   if (onLoggedIn) {
            //     onLoggedIn(result);
            //   }
            //   return true;
            // }
        });
    };
    (0, react_1.useEffect)(() => {
        if (searchParam.get('email') && process.env.NODE_ENV !== 'production') {
            adminLogin();
        }
    }, [searchParam]);
    const createAccountRedirect = () => {
        onCreateAccount
            ? //if onCreateAccount props available,
                //redirect to that page, otherwise use create account modal popup
                onCreateAccount()
            : setShowCreateAccountModal(true);
    };
    const onSignIn = (data, e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const { email, password } = data;
        // if onLoadingChange prop is passed, invoke it with true
        if (onLoadingChange) {
            onLoadingChange(true);
        }
        // TODO: replace use from
        Server_1.Server.call(package_js_1.packageName, 'signinWithPassword', email, password)
            .then((response) => {
            if (response === null || response === void 0 ? void 0 : response.auth) {
                const result = auth.updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    // user: response.user,
                    // userAccount: response.userAccount,
                });
                //temporary way for admin to login as other users
                if (searchParam.get('email') &&
                    process.env.NODE_ENV === 'production') {
                    // adminLogin().then((loggedIn) => {
                    //   if (!loggedIn && onLoggedIn) {
                    //     onLoggedIn(result);
                    //   }
                    // });
                }
                else if (onLoggedIn) {
                    onLoggedIn(result);
                }
            }
            if (!response || response.error) {
                alert(t(prefix + '.incorrectEmailPasswordError', 'Incorrect email and password combination'));
                reset();
                setFormIsHidden(false);
                // window.location.reload();
                // if onLoadingChange prop is passed, invoke it with false
                if (onLoadingChange) {
                    onLoadingChange(false);
                }
            }
        })
            .catch((err) => {
            console.error('Error signinWithPassword ', err);
        })
            .finally(() => {
            // if onLoadingChange prop is passed, invoke it with false
            if (onLoadingChange) {
                onLoadingChange(false);
            }
        });
    });
    const onNextForm = () => {
        const emailValue = getValues('email');
        const emailError = errors.email;
        if (!emailValue || emailError) {
            trigger('email');
        }
        else {
            // Rest of your code
            setFormIsHidden(true);
        }
    };
    return (react_1.default.createElement("div", { className: (0, ClassNames_1.cl)(SigninWithPasswordForm_module_css_1.default.root, className) },
        react_1.default.createElement("form", { className: SigninWithPasswordForm_module_css_1.default.form },
            react_1.default.createElement("div", { className: (0, ClassNames_1.cl)(formIsHidden ? SigninWithPasswordForm_module_css_1.default.hidden : null) },
                !showInputField ? (react_1.default.createElement(Button_1.Button, { className: buttonClassName, onClick: () => setShowInputField(true), variant: "outlined", fullWidth: true, startIcon: showEmailIcon && (react_1.default.createElement("img", { src: (0, LinkedFileStorage_1.asset)('/images/email.png'), alt: "email-icon", className: SigninWithPasswordForm_module_css_1.default.iconButton })) }, t(prefix + '.email', 'Continue with Email'))) : (react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'email', placeholder: t(prefix + '.emailPlaceholder', 'Type your@email here') }, register('email', {
                    required: true,
                    pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: t(prefix + '.unmatchedEmailError', 'Entered value does not match email format'),
                    },
                }), { autoComplete: "off", endAdornment: react_1.default.createElement("div", { className: SigninWithPasswordForm_module_css_1.default.end },
                        react_1.default.createElement("button", { className: SigninWithPasswordForm_module_css_1.default.button, type: "button", onClick: onNextForm },
                            react_1.default.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", stroke: "currentColor" },
                                react_1.default.createElement("path", { d: "M4 12h16m0 0-6-6m6 6-6 6", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })))) }))),
                errors.email && (react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.errorMessage }, t(prefix + '.invalidEmailError', 'Please type your valid email')))),
            react_1.default.createElement("div", { className: (0, ClassNames_1.cl)(!formIsHidden ? SigninWithPasswordForm_module_css_1.default.hidden : null) },
                react_1.default.createElement(TextField_1.TextField, Object.assign({ type: 'password', placeholder: t(prefix + '.passwordPlaceholder', 'Type your password here') }, register('password', { required: true }), { endAdornment: react_1.default.createElement("div", { className: SigninWithPasswordForm_module_css_1.default.end },
                        react_1.default.createElement("button", { className: SigninWithPasswordForm_module_css_1.default.button, onClick: handleSubmit(onSignIn) },
                            react_1.default.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", stroke: "currentColor" },
                                react_1.default.createElement("path", { d: "M4 12h16m0 0-6-6m6 6-6 6", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })))) })),
                errors.password && (react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.errorMessage }, t(prefix + '.passwordError', 'Please type your password'))))),
        showInputField && (react_1.default.createElement("div", { className: (0, ClassNames_1.cl)(SigninWithPasswordForm_module_css_1.default.bottomSection, errors.email || errors.password ? SigninWithPasswordForm_module_css_1.default.ExtraSpace : null) },
            react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.createAccount, onClick: createAccountRedirect }, t(prefix + '.createAccount', 'Create account')),
            react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.forgotPassword, onClick: () => setShowForgotPasswordModal(true) }, t(prefix + '.forgotPassword', 'Forgot password?')))),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showCreateAccountModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowCreateAccountModal(false) },
            react_1.default.createElement(CreateAccountForm_js_1.default, { className: SigninWithPasswordForm_module_css_1.default.modalForm, onAccountCreated: (auth) => {
                    setShowCreateAccountModal(false);
                    onLoggedIn(auth);
                } })),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showForgotPasswordModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowForgotPasswordModal(false), renderContent: react_1.default.createElement(ForgotPasswordForm_js_1.default, { className: SigninWithPasswordForm_module_css_1.default.modalForm }) })));
};
exports.SigninWithPasswordForm = SigninWithPasswordForm;
//# sourceMappingURL=SigninWithPasswordForm.js.map