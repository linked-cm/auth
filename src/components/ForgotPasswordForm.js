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
var react_1 = __importStar(require("react"));
var react_hook_form_1 = require("react-hook-form");
var ForgotPasswordForm_module_css_1 = __importDefault(require("./ForgotPasswordForm.module.css"));
var TextField_1 = require("lincd-input/components/TextField");
var Button_1 = require("lincd-mui-base/components/Button");
var Hooks_1 = require("@_linked/react/utils/Hooks");
var Server_1 = require("@_linked/server-utils/utils/Server");
var package_js_1 = require("../package.js");
var react_2 = require("@tolgee/react");
function ForgotPasswordForm(_a) {
    var restProps = __rest(_a, []);
    var _b = (0, react_hook_form_1.useForm)(), register = _b.register, handleSubmit = _b.handleSubmit, errors = _b.formState.errors, reset = _b.reset, setError = _b.setError;
    var _c = __read((0, react_1.useState)(''), 2), helperText = _c[0], setHelperText = _c[1];
    var _d = __read((0, react_1.useState)(false), 2), loading = _d[0], setLoading = _d[1];
    var t = (0, react_2.useTranslate)().t;
    var prefix = 'resetPassword';
    var onResetPassword = function (data) {
        var email = data.email;
        setLoading(true);
        Server_1.Server.call(package_js_1.packageName, 'sendResetPasswordLink', email)
            .then(function (res) {
            if (res) {
                if (res.error) {
                    setHelperText(res.error);
                }
                else {
                    setHelperText("We've sent you an email to ".concat(email, ". Please kindly check it to reset the password."));
                }
            }
        })
            .catch(function (error) {
            console.error(error);
        })
            .finally(function () {
            setLoading(false);
            reset();
        });
    };
    restProps = (0, Hooks_1.useStyles)(restProps, ForgotPasswordForm_module_css_1.default.root);
    return (react_1.default.createElement("form", __assign({}, restProps),
        react_1.default.createElement("h2", null, t(prefix + '.title', 'Reset Password')),
        react_1.default.createElement("div", { className: ForgotPasswordForm_module_css_1.default.FormGroup },
            react_1.default.createElement(TextField_1.TextField, __assign({ type: 'email' }, register('email', {
                required: t(prefix + '.emailRequired', 'Email field is required'),
            }), { placeholder: t(prefix + '.emailPlaceholder', 'Enter your valid email'), helperText: helperText })),
            errors.email && (react_1.default.createElement("p", { className: ForgotPasswordForm_module_css_1.default.ErrorMessage }, t(prefix + '.invalidEmailError', errors.email.message)))),
        react_1.default.createElement(Button_1.Button, { color: "primary", fullWidth: true, className: ForgotPasswordForm_module_css_1.default.FormButton, disabled: loading, onClick: handleSubmit(onResetPassword) }, loading
            ? t(prefix + '.sendingInstruction', 'Sending to your email...')
            : t(prefix + '.sendInstruction', 'Send me reset password instructions'))));
}
exports.default = ForgotPasswordForm;
//# sourceMappingURL=ForgotPasswordForm.js.map