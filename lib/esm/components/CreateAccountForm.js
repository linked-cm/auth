import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import style from './CreateAccountForm.module.css';
import { TextField } from 'lincd-input/components/TextField';
import { Button } from 'lincd-mui-base/components/Button';
import { useStyles } from '@_linked/react/utils/Hooks';
import { Server } from '@_linked/server-utils/utils/Server';
import { packageName } from '../package.js';
import { useAuth } from '../hooks/useAuth.js';
import { useTranslate } from '@tolgee/react';
export function CreateAccountForm({ onAccountCreated, ...restProps }) {
    var _a, _b;
    const { register, handleSubmit, getValues, watch, formState: { errors }, } = useForm();
    const [loading, setLoading] = useState(false);
    const [submitFeedback, setSubmitFeedback] = useState('');
    const [isAlertClosed, setIsAlertClosed] = useState(false);
    const auth = useAuth();
    const { t } = useTranslate();
    const prefix = 'createAccount';
    const createAccount = (data) => {
        //validation for password and confirmPassword
        if (watch('password') !== watch('confirmPassword')) {
            return;
        }
        //  set email to lowercase, before sending to server
        data.email = data.email.toLowerCase();
        setLoading(true);
        Server.call(packageName, 'createAccount', data).then((response) => {
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
    restProps = useStyles(restProps, style.root);
    return (React.createElement("form", { ...restProps },
        React.createElement("h2", null, t(prefix + '.title', 'Create Account')),
        submitFeedback && !isAlertClosed ? (React.createElement("div", { className: style.Alert },
            React.createElement("p", null, submitFeedback),
            React.createElement("span", { className: style.CloseBtn, onClick: closeAlert }, "\u2716"))) : null,
        React.createElement("div", { className: style.FormGroup },
            React.createElement(TextField, { type: 'text', placeholder: t(prefix + '.firstNamePlaceholder', 'Enter your first name'), ...register('firstName', { required: true }) }),
            errors.firstName && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.firstNameError', 'First name is required'))),
            React.createElement(TextField, { type: 'text', placeholder: t(prefix + '.lastNamePlaceholder', 'Enter your last name'), ...register('lastName') }),
            React.createElement(TextField, { type: 'email', placeholder: t(prefix + '.emailPlaceholder', 'Enter your email'), ...register('email', { required: true }) }),
            errors.email && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.emailError', 'Email is required'))),
            React.createElement(TextField, { type: 'email', placeholder: t(prefix + '.emailConfirmationPlaceholder', 'Confirm your email'), ...register('confirmEmail', {
                    required: true,
                }) }),
            (errors === null || errors === void 0 ? void 0 : errors.confirmEmail) && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.', 'Confirm email is required'))),
            watch('confirmEmail') !== watch('email') &&
                getValues('confirmEmail') ? (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.unmatchedEmailError', 'Email did not match'))) : null,
            React.createElement(TextField, { type: 'password', placeholder: t(prefix + '.passwordPlaceholder', 'Enter your password'), ...register('password', { required: true, minLength: 6 }) }),
            ((_a = errors === null || errors === void 0 ? void 0 : errors.password) === null || _a === void 0 ? void 0 : _a.type) === 'required' && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.passwordError', 'Password is required'))),
            ((_b = errors === null || errors === void 0 ? void 0 : errors.password) === null || _b === void 0 ? void 0 : _b.type) === 'minLength' && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.passwordLengthError', 'Password cannot less than 6 characters'))),
            React.createElement(TextField, { type: 'password', placeholder: t(prefix + '.passwordConfirmationPlaceholder', 'Confirm your password'), ...register('confirmPassword', {
                    required: true,
                }) }),
            (errors === null || errors === void 0 ? void 0 : errors.confirmPassword) && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.passwordConfirmationError', 'Confirm password is required'))),
            watch('confirmPassword') !== watch('password') &&
                getValues('confirmPassword') ? (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.unmatchedPasswordError', 'Password did not match'))) : null),
        React.createElement(Button, { color: "primary", fullWidth: true, className: style.FormButton, disabled: loading, onClick: handleSubmit(createAccount) }, loading
            ? t(prefix + '.loadingCreateAccountButton', 'Creating your account...')
            : t(prefix + '.createAccountButton', 'Create Account'))));
}
export default CreateAccountForm;
//# sourceMappingURL=CreateAccountForm.js.map