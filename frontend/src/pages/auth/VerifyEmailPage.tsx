import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { buildApiUrl } from '../../config/api.config';

interface VerificationResponse {
  success: boolean;
  message: string;
  user_id?: string;
}

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const token = searchParams.get('token');

  const verifyEmail = async (verificationToken: string) => {
    try {
      setStatus('loading');
      
      // Validar token antes de enviar
      if (!verificationToken || verificationToken.length < 10) {
        throw new Error('Token de verificación inválido');
      }

      const response = await fetch(buildApiUrl(`/auth/verify-email/${verificationToken}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Configuración de seguridad
        credentials: 'include',
      });

      const data: VerificationResponse = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verificado correctamente');
        
        // Redirigir al inicio después de 3 segundos
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: 'Email verificado correctamente. Ya puedes acceder a la plataforma.',
              type: 'success'
            }
          });
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Error al verificar el email');
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      setStatus('error');
      setMessage(
        error instanceof Error 
          ? error.message 
          : 'Error de conexión. Verifica tu conexión a internet.'
      );
    }
  };

  const handleRetry = async () => {
    if (!token) return;
    
    setIsRetrying(true);
    await verifyEmail(token);
    setIsRetrying(false);
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado en la URL');
      return;
    }

    // Verificar email automáticamente al cargar la página
    verifyEmail(token);
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificando tu email...
            </h2>
            <p className="text-gray-600">
              Por favor espera mientras procesamos tu verificación.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Email verificado correctamente!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Serás redirigido al login automáticamente...
              </p>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Ir al inicio ahora
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error en la verificación
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-4">
              {token && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRetrying ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Reintentando...
                    </>
                  ) : (
                    'Reintentar verificación'
                  )}
                </button>
              )}
              
              <div className="space-y-2">
                <Link
                  to="/resend-verification"
                  className="block text-blue-600 hover:text-blue-500 text-sm underline"
                >
                  Solicitar un nuevo correo de verificación
                </Link>
                <Link
                  to="/"
                  className="block text-gray-500 hover:text-gray-400 text-sm"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <img
            className="h-12 w-auto"
            src="/logo.png"
            alt="Stegmaier"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>
      </div>
      
      {/* Footer de seguridad */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Este proceso de verificación está protegido por medidas de seguridad avanzadas.
          <br />
          Si no solicitaste esta verificación, ignora este mensaje.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
