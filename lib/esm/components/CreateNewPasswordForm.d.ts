import React from 'react';
interface CreateNewPasswordFormProps {
    className?: string;
    token?: string;
    onPasswordIsReset?: () => void;
}
export declare function CreateNewPasswordForm({ token, onPasswordIsReset, ...restProps }: CreateNewPasswordFormProps): React.JSX.Element;
export default CreateNewPasswordForm;
