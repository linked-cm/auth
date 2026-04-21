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
exports.RemoveAccountButton = void 0;
const react_1 = __importStar(require("react"));
const RemoveAccountButton_module_css_1 = __importDefault(require("./RemoveAccountButton.module.css"));
const Modal_1 = require("lincd-mui-base/components/Modal");
const Button_1 = require("lincd-mui-base/components/Button");
const useAuth_js_1 = require("../hooks/useAuth.js");
const react_2 = require("@tolgee/react");
const RemoveAccountButton = (_a) => {
    var { confirmationText, agreeText, className } = _a, restProps = __rest(_a, ["confirmationText", "agreeText", "className"]);
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const auth = (0, useAuth_js_1.useAuth)();
    const { t } = (0, react_2.useTranslate)();
    const prefix = 'removeAccount';
    const onToggleModal = () => setIsModalOpen(!isModalOpen);
    const onRemoveAccount = () => __awaiter(void 0, void 0, void 0, function* () {
        onToggleModal();
        auth.removeAccount().then((res) => {
            if (res) {
                auth.signout();
                //hard refresh to the user from local memory
                window.location.href = '/';
            }
        });
    });
    // restProps = useStyles(restProps, style.root);
    return (react_1.default.createElement("div", Object.assign({}, restProps),
        react_1.default.createElement(Button_1.Button, { className: className, variant: "outlined", onClick: onToggleModal }, t(prefix + '.deleteProfileButton', 'Delete Profile')),
        react_1.default.createElement(Modal_1.Modal, { isOpen: isModalOpen, onClose: onToggleModal },
            react_1.default.createElement("div", { className: RemoveAccountButton_module_css_1.default.modal },
                react_1.default.createElement("p", null, confirmationText ||
                    t(prefix + '.deleteConfirmation', 'Are you sure you want to delete this account? Deleting your account will delete all personal information and all data related to you. You will not be able to undo this action')),
                react_1.default.createElement("div", { className: RemoveAccountButton_module_css_1.default.modalButtonContainer },
                    react_1.default.createElement(Button_1.Button, { color: 'secondary', onClick: onToggleModal }, confirmationText || t(prefix + '.cancel', 'Cancel')),
                    react_1.default.createElement(Button_1.Button, { onClick: onRemoveAccount }, agreeText || t(prefix + '.yes', 'Yes, delete my account')))))));
};
exports.RemoveAccountButton = RemoveAccountButton;
//register all components in this file
// registerPackageModule({ RemoveAccountButton });
//# sourceMappingURL=RemoveAccountButton.js.map