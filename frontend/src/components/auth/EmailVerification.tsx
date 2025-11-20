import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from '@/components/ui/alert';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * Componente para verificar el correo electrónico mediante token
 */
const EmailVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { verifyEmail } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setError('Token no encontrado');
        setLoading(false);
        return;
      }

      try {
        const result = await verifyEmail(token);
        setSuccess(result);
        setLoading(false);
      } catch (err) {
        setError('No se pudo verificar el correo electrónico. El token puede ser inválido o haber expirado.');
        setLoading(false);
      }
    };

    verifyEmailToken();
  }, [token, verifyEmail]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <img 
          src="/assets/images/Stegmaierlogo.png" 
          alt="Stegmaier Logo" 
          className="h-12 mx-auto mb-4" 
        />
        <h2 className="text-2xl font-bold text-gray-800">Verificación de Email</h2>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Verificando tu correo electrónico...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <Alert
              type="success"
              title="¡Verificación exitosa!"
              message="Tu correo electrónico ha sido verificado correctamente. Ahora puedes iniciar sesión en la plataforma."
            />
            <div className="flex justify-center mt-4">
              <Link 
                to="/login"
                className="inline-flex justify-center items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition duration-200 font-medium"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert
              type="error"
              title="Error de verificación"
              message={error || 'Ha ocurrido un error inesperado'}
            />
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Si el enlace ha expirado o tienes problemas para verificar tu correo, puedes solicitar un nuevo enlace.
              </p>
              <Link 
                to="/resend-verification"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Solicitar nuevo enlace de verificación
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
