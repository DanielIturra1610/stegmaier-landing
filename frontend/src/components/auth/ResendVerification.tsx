import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../ui/FormInput';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';

// Validación con Yup
const ResendSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
});

/**
 * Componente para reenviar el email de verificación
 */
const ResendVerification: React.FC = () => {
  const { resendVerification } = useAuth();
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    show: boolean;
  }>({
    success: false,
    message: '',
    show: false,
  });

  const handleSubmit = async (values: { email: string }, { setSubmitting, resetForm }: any) => {
    try {
      const success = await resendVerification(values.email);
      
      setStatus({
        success: true,
        message: 'Hemos enviado un nuevo enlace de verificación a tu correo electrónico.',
        show: true,
      });
      
      if (success) {
        resetForm();
      }
    } catch (error: any) {
      setStatus({
        success: false,
        message: error.response?.data?.detail || 'No se pudo enviar el enlace de verificación.',
        show: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <img 
          src="/assets/images/Stegmaierlogo.png" 
          alt="Stegmaier Logo" 
          className="h-12 mx-auto mb-4" 
        />
        <h2 className="text-2xl font-bold text-gray-800">Reenviar verificación</h2>
        <p className="text-gray-600 mt-2">
          Ingresa tu correo electrónico para recibir un nuevo enlace de verificación
        </p>
      </div>

      {status.show && (
        <Alert
          type={status.success ? 'success' : 'error'}
          message={status.message}
          onClose={() => setStatus(prev => ({ ...prev, show: false }))}
          className="mb-4"
        />
      )}

      <Formik
        initialValues={{ email: '' }}
        validationSchema={ResendSchema}
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
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-md transition duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace de verificación'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
      
      <div className="mt-6 text-center">
        <a 
          href="/login" 
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Volver a inicio de sesión
        </a>
      </div>
    </div>
  );
};

export default ResendVerification;
