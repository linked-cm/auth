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
exports.EditPasswordButton = EditPasswordButton;
var react_1 = __importStar(require("react"));
var Button_1 = require("lincd-mui-base/components/Button");
var EditPasswordButton_module_css_1 = __importDefault(require("./EditPasswordButton.module.css"));
var Modal_1 = require("lincd-mui-base/components/Modal");
var CreateNewPasswordForm_js_1 = __importDefault(require("./CreateNewPasswordForm.js"));
var AuthCredential_js_1 = require("../shapes/AuthCredential.js");
function EditPasswordButton(_a) {
    var onPasswordUpdated = _a.onPasswordUpdated;
    var _b = __read((0, react_1.useState)(false), 2), showModal = _b[0], setShowModal = _b[1];
    var _c = __read((0, react_1.useState)(false), 2), hasPassword = _c[0], sethasPassword = _c[1];
    var _d = __read((0, react_1.useState)(false), 2), updated = _d[0], setUpdated = _d[1];
    (0, react_1.useEffect)(function () {
        AuthCredential_js_1.AuthCredential.userHasAuthCredential().then(function (hasCredential) {
            sethasPassword(hasCredential);
        });
    });
    var onEdited = function () {
        setShowModal(false);
        setUpdated(true);
        setTimeout(function () {
            setUpdated(false);
        }, 3000);
    };
    return (hasPassword && (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Button_1.Button, { color: updated ? 'tertiary' : 'primary', fullWidth: true, variant: 'outlined', className: EditPasswordButton_module_css_1.default.FormButton, onClick: function () { return setShowModal(true); } }, updated ? '✔ Password updated' : 'Change Password'),
        react_1.default.createElement(Modal_1.Modal, { isOpen: showModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: function () { return setShowModal(false); } },
            react_1.default.createElement(CreateNewPasswordForm_js_1.default, { onPasswordIsReset: onEdited, className: EditPasswordButton_module_css_1.default.modalForm })))));
}
//# sourceMappingURL=EditPasswordButton.js.map