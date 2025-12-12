import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { buildApiUrl } from '../../config/api.config';

interface VerificationResponse {
  success: boolean;
  message: string;
  user_id?: string;
}

type VerificationStatus = 'loading' | 'success' | 'error' | 'already_verified' | 'expired';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState<string>('');
  const [hasVerified, setHasVerified] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const token = searchParams.get('token');

  const verifyEmail = async (verificationToken: string) => {
    // Prevenir múltiples llamadas
    if (hasVerified) return;
    setHasVerified(true);

    try {
      setStatus('loading');

      // Validar token antes de enviar
      if (!verificationToken || verificationToken.length < 10) {
        throw new Error('Token de verificación inválido');
      }

      console.log('🔍 [VerifyEmail] Calling API:', buildApiUrl('/auth/verify-email'));

      const response = await fetch(buildApiUrl('/auth/verify-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
        credentials: 'include',
      });

      console.log('🔍 [VerifyEmail] Response status:', response.status);

      const data: VerificationResponse = await response.json();
      console.log('🔍 [VerifyEmail] Response data:', data);

      if (response.ok && data.success) {
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
        // Manejar diferentes tipos de errores
        const errorMessage = data.message?.toLowerCase() || '';

        if (errorMessage.includes('already verified') || errorMessage.includes('ya verificado')) {
          setStatus('already_verified');
          setMessage('Tu email ya fue verificado anteriormente. Puedes iniciar sesión normalmente.');
        } else if (errorMessage.includes('expired') || errorMessage.includes('expirado')) {
          setStatus('expired');
          setMessage('El enlace de verificación ha expirado. Solicita uno nuevo.');
        } else {
          setStatus('error');
          setMessage(data.message || 'No se pudo verificar tu email. El token puede ser inválido o haber expirado.');
        }
      }
    } catch (error) {
      console.error('❌ [VerifyEmail] Error:', error);
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Error de conexión. Verifica tu conexión a internet.'
      );
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendMessage('Por favor ingresa un email válido');
      setResendStatus('error');
      return;
    }

    setResendStatus('loading');
    try {
      const response = await fetch(buildApiUrl('/auth/resend-verification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resendEmail }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setResendStatus('success');
        setResendMessage('Si existe una cuenta con ese email, recibirás un nuevo enlace de verificación.');
      } else if (data.message?.toLowerCase().includes('already verified')) {
        setResendStatus('success');
        setResendMessage('Tu email ya está verificado. Puedes iniciar sesión directamente.');
      } else {
        setResendStatus('error');
        setResendMessage(data.message || 'Error al enviar el email');
      }
    } catch {
      setResendStatus('error');
      setResendMessage('Error de conexión. Intenta nuevamente.');
    }
  };

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no encontrado en la URL');
      return;
    }

    // Verificar email automáticamente al cargar la página (solo una vez)
    if (!hasVerified) {
      verifyEmail(token);
    }
  }, [token, hasVerified]);

  const renderResendForm = () => (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600 mb-3">
        Ingresa tu email para recibir un nuevo enlace de verificación:
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button
          onClick={handleResendVerification}
          disabled={resendStatus === 'loading'}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
        >
          {resendStatus === 'loading' ? 'Enviando...' : 'Reenviar'}
        </button>
      </div>
      {resendMessage && (
        <p className={`mt-2 text-sm ${resendStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {resendMessage}
        </p>
      )}
    </div>
  );

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

      case 'already_verified':
        return (
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Tu email ya está verificado!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enlace expirado
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {renderResendForm()}
            <div className="mt-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-gray-400 text-sm"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verificación de email
            </h2>
            <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-4">{message}</p>

            <p className="text-gray-600 text-sm mb-4">
              Es posible que tu email ya esté verificado. Intenta iniciar sesión o solicita un nuevo enlace.
            </p>

            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Intentar iniciar sesión
              </Link>
            </div>

            {renderResendForm()}
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
