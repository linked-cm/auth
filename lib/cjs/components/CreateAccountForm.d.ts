import React from 'react';
import { AuthenticationResponse } from '../types/auth.js';
interface CreateAccountFormProps {
    className?: string;
    onAccountCreated?: (authentication?: AuthenticationResponse) => void;
}
export declare function CreateAccountForm({ onAccountCreated, ...restProps }: CreateAccountFormProps): React.JSX.Element;
export default CreateAccountForm;
