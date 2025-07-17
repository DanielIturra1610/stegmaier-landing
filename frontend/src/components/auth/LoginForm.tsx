import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../ui/FormInput';
import Alert from '../ui/Alert';
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

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, redirectPath = '/platform' }) => {
  const { login, isVerified } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showVerificationWarning, setShowVerificationWarning] = useState<boolean>(false);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setLoginError(null);
      
      // Llamamos al servicio de autenticación (el servicio se encarga de adaptar el formato)
      await login(values);
      
      // Verificamos si el email está verificado
      if (!isVerified) {
        setShowVerificationWarning(true);
        setSubmitting(false);
        return;
      }
      
      // Callback opcional cuando el login es exitoso
      if (onSuccess) {
        onSuccess();
      } else {
        // Aseguramos que la redirección use la URL completa y correcta
        console.log('Redirigiendo a:', redirectPath);
        // Forzamos la redirección usando una ruta absoluta
        const baseUrl = window.location.origin;
        const fullRedirectPath = redirectPath.startsWith('/') ? 
          `${baseUrl}${redirectPath}` : 
          `${baseUrl}/${redirectPath}`;
          
        console.log('URL completa:', fullRedirectPath);
        window.location.replace(fullRedirectPath);
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
        <Alert
          type="error"
          message={loginError}
          onClose={() => setLoginError(null)}
        />
      )}
      
      {showVerificationWarning && (
        <Alert
          type="warning"
          title="Email no verificado"
          message="Por favor verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada."
        />
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
