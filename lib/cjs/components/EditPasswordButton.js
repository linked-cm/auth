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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditPasswordButton = void 0;
const react_1 = __importStar(require("react"));
const Button_1 = require("lincd-mui-base/components/Button");
const EditPasswordButton_module_css_1 = __importDefault(require("./EditPasswordButton.module.css"));
const Modal_1 = require("lincd-mui-base/components/Modal");
const CreateNewPasswordForm_js_1 = __importDefault(require("./CreateNewPasswordForm.js"));
const AuthCredential_js_1 = require("../shapes/AuthCredential.js");
function EditPasswordButton({ onPasswordUpdated, }) {
    const [showModal, setShowModal] = (0, react_1.useState)(false);
    const [hasPassword, sethasPassword] = (0, react_1.useState)(false);
    const [updated, setUpdated] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        AuthCredential_js_1.AuthCredential.userHasAuthCredential().then((hasCredential) => {
            sethasPassword(hasCredential);
        });
    });
    const onEdited = () => {
        setShowModal(false);
        setUpdated(true);
        setTimeout(() => {
            setUpdated(false);
        }, 3000);
    };
    return (hasPassword && (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Button_1.Button, { color: updated ? 'tertiary' : 'primary', fullWidth: true, variant: 'outlined', className: EditPasswordButton_module_css_1.default.FormButton, onClick: () => setShowModal(true) }, updated ? '✔ Password updated' : 'Change Password'),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowModal(false) },
            react_1.default.createElement(CreateNewPasswordForm_js_1.default, { onPasswordIsReset: onEdited, className: EditPasswordButton_module_css_1.default.modalForm })))));
}
exports.EditPasswordButton = EditPasswordButton;
//# sourceMappingURL=EditPasswordButton.js.map