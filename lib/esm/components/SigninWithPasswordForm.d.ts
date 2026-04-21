import React from 'react';
import { AuthenticationResponse } from '../types/auth.js';
interface SigninWithPasswordFormProps {
    onCreateAccount?: () => void;
    onLoggedIn?: (data?: AuthenticationResponse) => void;
    onLoginFailed?: () => void;
    onForgotPassword?: () => void;
    className?: string;
    showEmailIcon?: boolean;
    startWithInputField?: boolean;
    buttonClassName?: string;
    onLoadingChange?: (loading: boolean) => void;
}
export declare const SigninWithPasswordForm: ({ onCreateAccount, onLoggedIn, className, onLoginFailed, startWithInputField, onForgotPassword, showEmailIcon, buttonClassName, onLoadingChange, }: SigninWithPasswordFormProps) => React.JSX.Element;
export {};
