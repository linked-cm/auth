"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.SigninWithPasswordForm = void 0;
var react_1 = __importStar(require("react"));
var react_hook_form_1 = require("react-hook-form");
var SigninWithPasswordForm_module_css_1 = __importDefault(require("./SigninWithPasswordForm.module.css"));
var TextField_1 = require("lincd-input/components/TextField");
var Modal_1 = require("lincd-mui-base/components/Modal");
var CreateAccountForm_js_1 = __importDefault(require("./CreateAccountForm.js"));
var ForgotPasswordForm_js_1 = __importDefault(require("./ForgotPasswordForm.js"));
var useAuth_js_1 = require("../hooks/useAuth.js");
var ClassNames_1 = require("@_linked/react/utils/ClassNames");
var Server_1 = require("@_linked/server-utils/utils/Server");
var Button_1 = require("lincd-mui-base/components/Button");
var package_js_1 = require("../package.js");
var react_router_dom_1 = require("react-router-dom");
var LinkedFileStorage_1 = require("@_linked/core/utils/LinkedFileStorage");
var react_2 = require("@tolgee/react");
var SigninWithPasswordForm = function (_a) {
    var onCreateAccount = _a.onCreateAccount, onLoggedIn = _a.onLoggedIn, className = _a.className, onLoginFailed = _a.onLoginFailed, startWithInputField = _a.startWithInputField, onForgotPassword = _a.onForgotPassword, showEmailIcon = _a.showEmailIcon, buttonClassName = _a.buttonClassName, onLoadingChange = _a.onLoadingChange;
    var _b = (0, react_hook_form_1.useForm)({ mode: 'all' }), register = _b.register, handleSubmit = _b.handleSubmit, errors = _b.formState.errors, trigger = _b.trigger, watch = _b.watch, reset = _b.reset, resetField = _b.resetField, getValues = _b.getValues;
    var _c = __read((0, react_1.useState)(false), 2), formIsHidden = _c[0], setFormIsHidden = _c[1];
    var _d = __read((0, react_1.useState)(startWithInputField || false), 2), showInputField = _d[0], setShowInputField = _d[1];
    var _e = __read((0, react_1.useState)(false), 2), showCreateAccountModal = _e[0], setShowCreateAccountModal = _e[1];
    var _f = __read((0, react_1.useState)(false), 2), showForgotPasswordModal = _f[0], setShowForgotPasswordModal = _f[1];
    var auth = (0, useAuth_js_1.useAuth)();
    var _g = __read((0, react_router_dom_1.useSearchParams)(), 1), searchParam = _g[0];
    var t = (0, react_2.useTranslate)().t;
    var prefix = 'signIn';
    var adminLogin = function () {
        return Server_1.Server.call(package_js_1.packageName, 'signinDevelopment', searchParam.get('email')).then(function (response) {
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
    (0, react_1.useEffect)(function () {
        if (searchParam.get('email') && process.env.NODE_ENV !== 'production') {
            adminLogin();
        }
    }, [searchParam]);
    var createAccountRedirect = function () {
        onCreateAccount
            ? //if onCreateAccount props available,
                //redirect to that page, otherwise use create account modal popup
                onCreateAccount()
            : setShowCreateAccountModal(true);
    };
    var onSignIn = function (data, e) { return __awaiter(void 0, void 0, void 0, function () {
        var email, password;
        return __generator(this, function (_a) {
            e.preventDefault();
            email = data.email, password = data.password;
            // if onLoadingChange prop is passed, invoke it with true
            if (onLoadingChange) {
                onLoadingChange(true);
            }
            // TODO: replace use from
            Server_1.Server.call(package_js_1.packageName, 'signinWithPassword', email, password)
                .then(function (response) {
                if (response === null || response === void 0 ? void 0 : response.auth) {
                    var result = auth.updateAuth({
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
                .catch(function (err) {
                console.error('Error signinWithPassword ', err);
            })
                .finally(function () {
                // if onLoadingChange prop is passed, invoke it with false
                if (onLoadingChange) {
                    onLoadingChange(false);
                }
            });
            return [2 /*return*/];
        });
    }); };
    var onNextForm = function () {
        var emailValue = getValues('email');
        var emailError = errors.email;
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
                !showInputField ? (react_1.default.createElement(Button_1.Button, { className: buttonClassName, onClick: function () { return setShowInputField(true); }, variant: "outlined", fullWidth: true, startIcon: showEmailIcon && (react_1.default.createElement("img", { src: (0, LinkedFileStorage_1.asset)('/images/email.png'), alt: "email-icon", className: SigninWithPasswordForm_module_css_1.default.iconButton })) }, t(prefix + '.email', 'Continue with Email'))) : (react_1.default.createElement(TextField_1.TextField, __assign({ type: 'email', placeholder: t(prefix + '.emailPlaceholder', 'Type your@email here') }, register('email', {
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
                react_1.default.createElement(TextField_1.TextField, __assign({ type: 'password', placeholder: t(prefix + '.passwordPlaceholder', 'Type your password here') }, register('password', { required: true }), { endAdornment: react_1.default.createElement("div", { className: SigninWithPasswordForm_module_css_1.default.end },
                        react_1.default.createElement("button", { className: SigninWithPasswordForm_module_css_1.default.button, onClick: handleSubmit(onSignIn) },
                            react_1.default.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", stroke: "currentColor" },
                                react_1.default.createElement("path", { d: "M4 12h16m0 0-6-6m6 6-6 6", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })))) })),
                errors.password && (react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.errorMessage }, t(prefix + '.passwordError', 'Please type your password'))))),
        showInputField && (react_1.default.createElement("div", { className: (0, ClassNames_1.cl)(SigninWithPasswordForm_module_css_1.default.bottomSection, errors.email || errors.password ? SigninWithPasswordForm_module_css_1.default.ExtraSpace : null) },
            react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.createAccount, onClick: createAccountRedirect }, t(prefix + '.createAccount', 'Create account')),
            react_1.default.createElement("p", { className: SigninWithPasswordForm_module_css_1.default.forgotPassword, onClick: function () { return setShowForgotPasswordModal(true); } }, t(prefix + '.forgotPassword', 'Forgot password?')))),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showCreateAccountModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: function () { return setShowCreateAccountModal(false); } },
            react_1.default.createElement(CreateAccountForm_js_1.default, { className: SigninWithPasswordForm_module_css_1.default.modalForm, onAccountCreated: function (auth) {
                    setShowCreateAccountModal(false);
                    onLoggedIn(auth);
                } })),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showForgotPasswordModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: function () { return setShowForgotPasswordModal(false); }, renderContent: react_1.default.createElement(ForgotPasswordForm_js_1.default, { className: SigninWithPasswordForm_module_css_1.default.modalForm }) })));
};
exports.SigninWithPasswordForm = SigninWithPasswordForm;
//# sourceMappingURL=SigninWithPasswordForm.js.map