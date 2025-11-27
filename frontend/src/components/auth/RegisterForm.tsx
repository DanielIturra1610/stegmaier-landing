import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import FormInput from '../ui/FormInput';
import { Alert } from '@/components/ui/alert';
import LoadingSpinner from '../ui/LoadingSpinner';

// Validación con Yup
const RegisterSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(4, 'El nombre completo debe tener al menos 4 caracteres')
    .max(100, 'El nombre completo es demasiado largo')
    .required('Nombre completo es requerido')
    .test('has-space', 'Por favor ingresa tu nombre y apellido', value => {
      return value ? value.trim().includes(' ') : false;
    }),
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'
    )
    .required('Contraseña es requerida'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirmar contraseña es requerido'),
});

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setRegistrationError(null);

      // Extraemos los datos necesarios para el registro
      const { fullName, email, password } = values;

      // Dividir el nombre completo en firstName y lastName para mantener compatibilidad
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User'; // Si no hay apellido, usar 'User'

      // Llamamos al servicio de autenticación
      // El registro automáticamente hace login y autentica al usuario
      await register({ firstName, lastName, email, password });

      setRegistrationSuccess(true);

      // Callback opcional cuando el registro es exitoso
      if (onSuccess) {
        onSuccess();
      }

      // Redirigir automáticamente a la página de selección de tenant
      // después de un breve delay para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate('/select-tenant');
      }, 1500);
    } catch (error: any) {
      // Manejar errores específicos de la API
      const errorMsg = error.response?.data?.detail ||
                        'Error al registrar usuario. Por favor intenta de nuevo.';
      setRegistrationError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {registrationError && (
        <Alert
          type="error"
          message={registrationError}
          onClose={() => setRegistrationError(null)}
        />
      )}
      
      {registrationSuccess ? (
        <Alert
          type="success"
          title="¡Registro exitoso!"
          message="Tu cuenta ha sido creada. Serás redirigido a la selección de organización..."
        />
      ) : (
        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <FormInput
                label="Nombre Completo"
                name="fullName"
                type="text"
                placeholder="Juan Pérez"
                required
              />
              
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
                autoComplete="new-password"
              />
              
              <FormInput
                label="Confirmar contraseña"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="new-password"
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
                      Registrando...
                    </>
                  ) : (
                    'Registrarse'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};

export default RegisterForm;
