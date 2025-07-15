import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';

/**
 * Página de recordatorio para verificar email
 * Se muestra a usuarios que iniciaron sesión pero no han verificado su email
 */
const VerifyReminderPage: React.FC = () => {
  const { user, logout, resendVerification } = useAuth();
  const [resendStatus, setResendStatus] = React.useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({
    loading: false,
    success: false,
    error: null,
  });

  const handleResendVerification = async () => {
    if (!user?.email || resendStatus.loading) return;

    setResendStatus({ loading: true, success: false, error: null });

    try {
      await resendVerification(user.email);
      setResendStatus({
        loading: false,
        success: true,
        error: null,
      });
    } catch (error: any) {
      setResendStatus({
        loading: false,
        success: false,
        error: error.response?.data?.detail || 'Error al reenviar el email de verificación',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-6 sm:p-10">
          <div className="text-center mb-6">
            <img 
              src="/assets/images/Stegmaierlogo.png" 
              alt="Stegmaier Logo" 
              className="h-12 mx-auto mb-4" 
            />

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Verifica tu correo electrónico
            </h1>
            
            <div className="bg-primary-50 rounded-lg p-4 mb-6 mt-4">
              <p className="text-primary-800">
                Para acceder a la plataforma de cursos, primero debes verificar tu dirección de correo electrónico.
              </p>
            </div>
            
            {resendStatus.success && (
              <Alert 
                type="success"
                title="Email enviado"
                message="Se ha enviado un nuevo enlace de verificación a tu correo electrónico."
                className="mb-4"
              />
            )}
            
            {resendStatus.error && (
              <Alert 
                type="error"
                message={resendStatus.error}
                onClose={() => setResendStatus(prev => ({ ...prev, error: null }))}
                className="mb-4"
              />
            )}
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Te hemos enviado un email con un enlace de verificación a:
              </p>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p className="font-medium text-gray-800">{user?.email || 'tu correo electrónico'}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={handleResendVerification}
                disabled={resendStatus.loading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-colors"
              >
                {resendStatus.loading ? 'Enviando...' : 'Reenviar verificación'}
              </button>
              
              <button
                onClick={logout}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>
                Si no encuentras el email, revisa tu carpeta de spam o 
                <Link to="/resend-verification" className="text-primary-600 hover:text-primary-700 ml-1">
                  solicita un nuevo enlace
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyReminderPage;
