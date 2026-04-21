import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateNewPasswordForm from './CreateNewPasswordForm.js';
import style from './ForgotPasswordCallback.module.css';

export default function ForgotPasswordCallback({ onPasswordIsReset }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  return (
    <CreateNewPasswordForm
      token={token}
      onPasswordIsReset={onPasswordIsReset}
    />
  );
}
