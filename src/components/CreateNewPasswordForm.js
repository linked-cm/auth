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
exports.CreateNewPasswordForm = CreateNewPasswordForm;
var react_1 = __importStar(require("react"));
var react_hook_form_1 = require("react-hook-form");
var CreateNewPasswordForm_module_css_1 = __importDefault(require("./CreateNewPasswordForm.module.css"));
var TextField_1 = require("lincd-input/components/TextField");
var Button_1 = require("lincd-mui-base/components/Button");
var Hooks_1 = require("@_linked/react/utils/Hooks");
var Server_1 = require("@_linked/server-utils/utils/Server");
var package_js_1 = require("../package.js");
var useAuth_js_1 = require("../hooks/useAuth.js");
var dialog_1 = require("@capacitor/dialog");
function CreateNewPasswordForm(_a) {
    var _this = this;
    var _b, _c;
    var token = _a.token, onPasswordIsReset = _a.onPasswordIsReset, restProps = __rest(_a, ["token", "onPasswordIsReset"]);
    var _d = (0, react_hook_form_1.useForm)(), register = _d.register, handleSubmit = _d.handleSubmit, getValues = _d.getValues, watch = _d.watch, errors = _d.formState.errors;
    var auth = (0, useAuth_js_1.useAuth)();
    var _e = __read((0, react_1.useState)(false), 2), loading = _e[0], setLoading = _e[1];
    var resetPassword = function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var res, error_1;
        var password = _b.password, confirmPassword = _b.confirmPassword;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, 4, 5]);
                    setLoading(true);
                    return [4 /*yield*/, Server_1.Server.call(package_js_1.packageName, 'resetPassword', password, confirmPassword, token)];
                case 1:
                    res = _c.sent();
                    if (res.auth && onPasswordIsReset) {
                        auth.updateAuth({
                            auth: res.auth,
                            accessToken: res.accessToken,
                            refreshToken: res.refreshToken,
                        });
                        onPasswordIsReset();
                    }
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _c.sent();
                    console.error('Error resetting password:', error_1);
                    return [4 /*yield*/, dialog_1.Dialog.alert({
                            title: 'Something went wrong',
                            message: 'Failed to reset password. Please try again or contact support.',
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    restProps = (0, Hooks_1.useStyles)(restProps, CreateNewPasswordForm_module_css_1.default.root);
    // disable button if any error or password not matches or fields are empty
    var password = watch('password');
    var confirmPassword = watch('confirmPassword');
    var isDisabled = !!errors.password ||
        !!errors.confirmPassword ||
        !password ||
        !confirmPassword ||
        confirmPassword !== password ||
        loading;
    return (react_1.default.createElement("div", __assign({}, restProps),
        react_1.default.createElement("form", null,
            react_1.default.createElement("h2", null, "Set A New Password"),
            react_1.default.createElement("div", { className: CreateNewPasswordForm_module_css_1.default.FormGroup },
                react_1.default.createElement(TextField_1.TextField, __assign({ type: 'password', placeholder: "Enter new password", onBlur: function () { } }, register('password', {
                    required: true,
                    minLength: 6,
                }))),
                ((_b = errors === null || errors === void 0 ? void 0 : errors.password) === null || _b === void 0 ? void 0 : _b.type) === 'required' && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password is required")),
                ((_c = errors === null || errors === void 0 ? void 0 : errors.password) === null || _c === void 0 ? void 0 : _c.type) === 'minLength' && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password cannot less than 6 characters")),
                react_1.default.createElement(TextField_1.TextField, __assign({ type: 'password', placeholder: "Confirm your password", onBlur: function () { } }, register('confirmPassword', {
                    required: true,
                }))),
                (errors === null || errors === void 0 ? void 0 : errors.confirmPassword) && (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Confirm password is required")),
                confirmPassword !== password && confirmPassword ? (react_1.default.createElement("p", { className: CreateNewPasswordForm_module_css_1.default.ErrorMessage }, "Password did not match")) : null),
            react_1.default.createElement(Button_1.Button, { color: "primary", fullWidth: true, disabled: isDisabled, onClick: handleSubmit(resetPassword) }, loading ? 'Saving...' : 'Save'))));
}
exports.default = CreateNewPasswordForm;
//# sourceMappingURL=CreateNewPasswordForm.js.map