import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import style from './ForgotPasswordForm.module.css';
import { TextField } from 'lincd-input/components/TextField';
import { Button } from 'lincd-mui-base/components/Button';
import { useStyles } from '@_linked/react/utils/Hooks';
import { Server } from '@_linked/server-utils/utils/Server';
import { packageName } from '../package.js';
import { useTranslate } from '@tolgee/react';
function ForgotPasswordForm({ ...restProps }) {
    const { register, handleSubmit, formState: { errors }, reset, setError, } = useForm();
    const [helperText, setHelperText] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useTranslate();
    const prefix = 'resetPassword';
    const onResetPassword = (data) => {
        const { email } = data;
        setLoading(true);
        Server.call(packageName, 'sendResetPasswordLink', email)
            .then((res) => {
            if (res) {
                if (res.error) {
                    setHelperText(res.error);
                }
                else {
                    setHelperText(`We\'ve sent you an email to ${email}. Please kindly check it to reset the password.`);
                }
            }
        })
            .catch((error) => {
            console.error(error);
        })
            .finally(() => {
            setLoading(false);
            reset();
        });
    };
    restProps = useStyles(restProps, style.root);
    return (React.createElement("form", { ...restProps },
        React.createElement("h2", null, t(prefix + '.title', 'Reset Password')),
        React.createElement("div", { className: style.FormGroup },
            React.createElement(TextField, { type: 'email', ...register('email', {
                    required: t(prefix + '.emailRequired', 'Email field is required'),
                }), placeholder: t(prefix + '.emailPlaceholder', 'Enter your valid email'), helperText: helperText }),
            errors.email && (React.createElement("p", { className: style.ErrorMessage }, t(prefix + '.invalidEmailError', errors.email.message)))),
        React.createElement(Button, { color: "primary", fullWidth: true, className: style.FormButton, disabled: loading, onClick: handleSubmit(onResetPassword) }, loading
            ? t(prefix + '.sendingInstruction', 'Sending to your email...')
            : t(prefix + '.sendInstruction', 'Send me reset password instructions'))));
}
export default ForgotPasswordForm;
//# sourceMappingURL=ForgotPasswordForm.js.map