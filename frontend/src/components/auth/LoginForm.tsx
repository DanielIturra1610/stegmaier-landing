import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../ui/FormInput';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingSpinner from '../ui/LoadingSpinner';

// Validación con Yup
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: Yup.string()
    .required('Contraseña es requerida'),
});

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectPath }) => {
  const { login, isVerified, user } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showVerificationWarning, setShowVerificationWarning] = useState<boolean>(false);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setLoginError(null);
      
      // Llamamos al servicio de autenticación (el servicio se encarga de adaptar el formato)
      await login(values);
      
      // Para usuarios de la plataforma de cursos, omitimos la verificación de email
      // ya que todos los usuarios se consideran verificados
      
      // Callback opcional cuando el login es exitoso
      if (onSuccess) {
        onSuccess();
      } else {
        // Obtener datos del usuario actualizado después del login
        const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
        console.log('Usuario logueado:', userData);
        
        // MULTI-ROLE: Si el usuario tiene múltiples roles, redirigir a selección de rol
        if (userData.has_multiple_roles && userData.roles && userData.roles.length > 1) {
          console.log(`Usuario con múltiples roles detectado (${userData.roles.join(', ')}), redirigiendo a selección de rol`);
          navigate('/auth/role-selection', { 
            state: { from: redirectPath || '/platform' }
          });
          return;
        }
        
        // Determinar la ruta de redirección basada en el rol del usuario
        let finalRedirectPath = redirectPath;
        
        // Si no se especificó redirectPath, usar lógica por defecto basada en rol
        if (!finalRedirectPath) {
          // Redirigir todos los usuarios autenticados a /platform
          // El sidebar se encargará de mostrar la vista apropiada según el rol
          console.log(`Usuario autenticado (${userData.role}), redirigiendo a /platform`);
          finalRedirectPath = '/platform';
        }
        
        console.log('Redirigiendo a:', finalRedirectPath);
        // Forzamos la redirección usando navigate
        navigate(finalRedirectPath);
      }
    } catch (error: any) {
      // Manejar errores específicos de la API
      const errorMsg = error.response?.data?.detail || 
                      'Credenciales inválidas. Por favor intenta de nuevo.';
      setLoginError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <>
      {loginError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loginError}</AlertDescription>
        </Alert>
      )}
      
      {showVerificationWarning && (
        <Alert className="mb-4">
          <AlertTitle>Email no verificado</AlertTitle>
          <AlertDescription>
            Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.
          </AlertDescription>
        </Alert>
      )}
      
      <Formik
        initialValues={{
          email: '',
          password: '',
        }}
        validationSchema={LoginSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <FormInput
              label="Correo electrónico"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
            
            <FormInput
              label="Contraseña"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            
            <div className="flex justify-end">
              <a 
                href="/forgot-password" 
                className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-md transition duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default LoginForm;
