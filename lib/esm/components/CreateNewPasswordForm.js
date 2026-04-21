import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import style from './CreateNewPasswordForm.module.css';
import { TextField } from 'lincd-input/components/TextField';
import { Button } from 'lincd-mui-base/components/Button';
import { useStyles } from '@_linked/react/utils/Hooks';
import { Server } from '@_linked/server-utils/utils/Server';
import { packageName } from '../package.js';
import { useAuth } from '../hooks/useAuth.js';
import { Dialog } from '@capacitor/dialog';
export function CreateNewPasswordForm({ token, onPasswordIsReset, ...restProps }) {
    var _a, _b;
    const { register, handleSubmit, getValues, watch, formState: { errors }, } = useForm();
    const auth = useAuth();
    const [loading, setLoading] = useState(false);
    const resetPassword = async ({ password, confirmPassword, }) => {
        try {
            setLoading(true);
            const res = await Server.call(packageName, 'resetPassword', password, confirmPassword, token);
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
            await Dialog.alert({
                title: 'Something went wrong',
                message: 'Failed to reset password. Please try again or contact support.',
            });
        }
        finally {
            setLoading(false);
        }
    };
    restProps = useStyles(restProps, style.root);
    // disable button if any error or password not matches or fields are empty
    const password = watch('password');
    const confirmPassword = watch('confirmPassword');
    const isDisabled = !!errors.password ||
        !!errors.confirmPassword ||
        !password ||
        !confirmPassword ||
        confirmPassword !== password ||
        loading;
    return (React.createElement("div", { ...restProps },
        React.createElement("form", null,
            React.createElement("h2", null, "Set A New Password"),
            React.createElement("div", { className: style.FormGroup },
                React.createElement(TextField, { type: 'password', placeholder: "Enter new password", onBlur: () => { }, ...register('password', {
                        required: true,
                        minLength: 6,
                    }) }),
                ((_a = errors === null || errors === void 0 ? void 0 : errors.password) === null || _a === void 0 ? void 0 : _a.type) === 'required' && (React.createElement("p", { className: style.ErrorMessage }, "Password is required")),
                ((_b = errors === null || errors === void 0 ? void 0 : errors.password) === null || _b === void 0 ? void 0 : _b.type) === 'minLength' && (React.createElement("p", { className: style.ErrorMessage }, "Password cannot less than 6 characters")),
                React.createElement(TextField, { type: 'password', placeholder: "Confirm your password", onBlur: () => { }, ...register('confirmPassword', {
                        required: true,
                    }) }),
                (errors === null || errors === void 0 ? void 0 : errors.confirmPassword) && (React.createElement("p", { className: style.ErrorMessage }, "Confirm password is required")),
                confirmPassword !== password && confirmPassword ? (React.createElement("p", { className: style.ErrorMessage }, "Password did not match")) : null),
            React.createElement(Button, { color: "primary", fullWidth: true, disabled: isDisabled, onClick: handleSubmit(resetPassword) }, loading ? 'Saving...' : 'Save'))));
}
export default CreateNewPasswordForm;
//# sourceMappingURL=CreateNewPasswordForm.js.map