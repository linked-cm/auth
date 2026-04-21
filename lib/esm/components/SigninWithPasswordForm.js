import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import style from './SigninWithPasswordForm.module.css';
import { TextField } from 'lincd-input/components/TextField';
import { Modal } from 'lincd-mui-base/components/Modal';
import CreateAccountForm from './CreateAccountForm.js';
import ForgotPasswordForm from './ForgotPasswordForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { cl } from '@_linked/react/utils/ClassNames';
import { Server } from '@_linked/server-utils/utils/Server';
import { Button } from 'lincd-mui-base/components/Button';
import { packageName } from '../package.js';
import { useSearchParams } from 'react-router-dom';
import { asset } from '@_linked/core/utils/LinkedFileStorage';
import { useTranslate } from '@tolgee/react';
export const SigninWithPasswordForm = ({ onCreateAccount, onLoggedIn, className, onLoginFailed, startWithInputField, onForgotPassword, showEmailIcon, buttonClassName, onLoadingChange, // callback function invoked when the loading state changes, you can pass a function to handle the loading state when call the server
 }) => {
    const { register, handleSubmit, formState: { errors }, trigger, watch, reset, resetField, getValues, } = useForm({ mode: 'all' });
    const [formIsHidden, setFormIsHidden] = useState(false);
    const [showInputField, setShowInputField] = useState(startWithInputField || false);
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const auth = useAuth();
    const [searchParam] = useSearchParams();
    const { t } = useTranslate();
    let prefix = 'signIn';
    const adminLogin = () => {
        return Server.call(packageName, 'signinDevelopment', searchParam.get('email')).then((response) => {
            // if (response.auth) {
            //   const result = auth.updateAuth(
            //     response.auth,
            //     response.accessToken,
            //     response.refreshToken,
            //   );
            //   if (onLoggedIn) {
            //     onLoggedIn(result);
            //   }
            //   return true;
            // }
        });
    };
    useEffect(() => {
        if (searchParam.get('email') && process.env.NODE_ENV !== 'production') {
            adminLogin();
        }
    }, [searchParam]);
    const createAccountRedirect = () => {
        onCreateAccount
            ? //if onCreateAccount props available,
                //redirect to that page, otherwise use create account modal popup
                onCreateAccount()
            : setShowCreateAccountModal(true);
    };
    const onSignIn = async (data, e) => {
        e.preventDefault();
        const { email, password } = data;
        // if onLoadingChange prop is passed, invoke it with true
        if (onLoadingChange) {
            onLoadingChange(true);
        }
        // TODO: replace use from
        Server.call(packageName, 'signinWithPassword', email, password)
            .then((response) => {
            if (response === null || response === void 0 ? void 0 : response.auth) {
                const result = auth.updateAuth({
                    auth: response.auth,
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    // user: response.user,
                    // userAccount: response.userAccount,
                });
                //temporary way for admin to login as other users
                if (searchParam.get('email') &&
                    process.env.NODE_ENV === 'production') {
                    // adminLogin().then((loggedIn) => {
                    //   if (!loggedIn && onLoggedIn) {
                    //     onLoggedIn(result);
                    //   }
                    // });
                }
                else if (onLoggedIn) {
                    onLoggedIn(result);
                }
            }
            if (!response || response.error) {
                alert(t(prefix + '.incorrectEmailPasswordError', 'Incorrect email and password combination'));
                reset();
                setFormIsHidden(false);
                // window.location.reload();
                // if onLoadingChange prop is passed, invoke it with false
                if (onLoadingChange) {
                    onLoadingChange(false);
                }
            }
        })
            .catch((err) => {
            console.error('Error signinWithPassword ', err);
        })
            .finally(() => {
            // if onLoadingChange prop is passed, invoke it with false
            if (onLoadingChange) {
                onLoadingChange(false);
            }
        });
    };
    const onNextForm = () => {
        const emailValue = getValues('email');
        const emailError = errors.email;
        if (!emailValue || emailError) {
            trigger('email');
        }
        else {
            // Rest of your code
            setFormIsHidden(true);
        }
    };
    return (React.createElement("div", { className: cl(style.root, className) },
        React.createElement("form", { className: style.form },
            React.createElement("div", { className: cl(formIsHidden ? style.hidden : null) },
                !showInputField ? (React.createElement(Button, { className: buttonClassName, onClick: () => setShowInputField(true), variant: "outlined", fullWidth: true, startIcon: showEmailIcon && (React.createElement("img", { src: asset('/images/email.png'), alt: "email-icon", className: style.iconButton })) }, t(prefix + '.email', 'Continue with Email'))) : (React.createElement(TextField, { type: 'email', placeholder: t(prefix + '.emailPlaceholder', 'Type your@email here'), ...register('email', {
                        required: true,
                        pattern: {
                            value: /\S+@\S+\.\S+/,
                            message: t(prefix + '.unmatchedEmailError', 'Entered value does not match email format'),
                        },
                    }), autoComplete: "off", endAdornment: React.createElement("div", { className: style.end },
                        React.createElement("button", { className: style.button, type: "button", onClick: onNextForm },
                            React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", stroke: "currentColor" },
                                React.createElement("path", { d: "M4 12h16m0 0-6-6m6 6-6 6", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })))) })),
                errors.email && (React.createElement("p", { className: style.errorMessage }, t(prefix + '.invalidEmailError', 'Please type your valid email')))),
            React.createElement("div", { className: cl(!formIsHidden ? style.hidden : null) },
                React.createElement(TextField, { type: 'password', placeholder: t(prefix + '.passwordPlaceholder', 'Type your password here'), ...register('password', { required: true }), endAdornment: React.createElement("div", { className: style.end },
                        React.createElement("button", { className: style.button, onClick: handleSubmit(onSignIn) },
                            React.createElement("svg", { width: "24", height: "24", viewBox: "0 0 24 24", stroke: "currentColor" },
                                React.createElement("path", { d: "M4 12h16m0 0-6-6m6 6-6 6", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })))) }),
                errors.password && (React.createElement("p", { className: style.errorMessage }, t(prefix + '.passwordError', 'Please type your password'))))),
        showInputField && (React.createElement("div", { className: cl(style.bottomSection, errors.email || errors.password ? style.ExtraSpace : null) },
            React.createElement("p", { className: style.createAccount, onClick: createAccountRedirect }, t(prefix + '.createAccount', 'Create account')),
            React.createElement("p", { className: style.forgotPassword, onClick: () => setShowForgotPasswordModal(true) }, t(prefix + '.forgotPassword', 'Forgot password?')))),
        React.createElement(Modal, { isOpen: showCreateAccountModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowCreateAccountModal(false) },
            React.createElement(CreateAccountForm, { className: style.modalForm, onAccountCreated: (auth) => {
                    setShowCreateAccountModal(false);
                    onLoggedIn(auth);
                } })),
        React.createElement(Modal, { isOpen: showForgotPasswordModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowForgotPasswordModal(false), renderContent: React.createElement(ForgotPasswordForm, { className: style.modalForm }) })));
};
//# sourceMappingURL=SigninWithPasswordForm.js.map