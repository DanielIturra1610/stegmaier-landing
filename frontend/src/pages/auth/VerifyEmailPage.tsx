import React from 'react';
import EmailVerification from '../../components/auth/EmailVerification';

/**
 * Página para verificar el email a través del token recibido
 */
const VerifyEmailPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <EmailVerification />
    </div>
  );
};

export default VerifyEmailPage;
