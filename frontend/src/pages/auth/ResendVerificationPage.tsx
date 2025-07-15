import React from 'react';
import ResendVerification from '../../components/auth/ResendVerification';

/**
 * Página para solicitar reenvío del email de verificación
 */
const ResendVerificationPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <ResendVerification />
    </div>
  );
};

export default ResendVerificationPage;
