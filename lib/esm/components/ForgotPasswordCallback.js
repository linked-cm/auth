import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateNewPasswordForm from './CreateNewPasswordForm.js';
export default function ForgotPasswordCallback({ onPasswordIsReset }) {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    return (React.createElement(CreateNewPasswordForm, { token: token, onPasswordIsReset: onPasswordIsReset }));
}
//# sourceMappingURL=ForgotPasswordCallback.js.map