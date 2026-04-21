import React, { useEffect, useState } from 'react';
import { Button } from 'lincd-mui-base/components/Button';
import style from './EditPasswordButton.module.css';
import { Modal } from 'lincd-mui-base/components/Modal';
import CreateNewPasswordForm from './CreateNewPasswordForm.js';
import { AuthCredential } from '../shapes/AuthCredential.js';
export function EditPasswordButton({ onPasswordUpdated, }) {
    const [showModal, setShowModal] = useState(false);
    const [hasPassword, sethasPassword] = useState(false);
    const [updated, setUpdated] = useState(false);
    useEffect(() => {
        AuthCredential.userHasAuthCredential().then((hasCredential) => {
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
    return (hasPassword && (React.createElement(React.Fragment, null,
        React.createElement(Button, { color: updated ? 'tertiary' : 'primary', fullWidth: true, variant: 'outlined', className: style.FormButton, onClick: () => setShowModal(true) }, updated ? '✔ Password updated' : 'Change Password'),
        React.createElement(Modal, { isOpen: showModal, backdrop: "rgba(0, 0, 0, 0.8)", onClose: () => setShowModal(false) },
            React.createElement(CreateNewPasswordForm, { onPasswordIsReset: onEdited, className: style.modalForm })))));
}
//# sourceMappingURL=EditPasswordButton.js.map