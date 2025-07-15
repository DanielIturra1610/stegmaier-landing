import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import FormInput from '../ui/FormInput';
import Alert from '../ui/Alert';
import LoadingSpinner from '../ui/LoadingSpinner';

// Validación con Yup
const RegisterSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'Demasiado corto')
    .max(50, 'Demasiado largo')
    .required('Nombre es requerido'),
  lastName: Yup.string()
    .min(2, 'Demasiado corto')
    .max(50, 'Demasiado largo')
    .required('Apellido es requerido'),
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
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      setRegistrationError(null);
      
      // Extraemos los datos necesarios para el registro
      const { firstName, lastName, email, password } = values;
      
      // Llamamos al servicio de autenticación
      await register({ firstName, lastName, email, password });
      
      setRegistrationSuccess(true);
      
      // Callback opcional cuando el registro es exitoso
      if (onSuccess) {
        onSuccess();
      }
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
          message="Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada para activar tu cuenta."
        />
      ) : (
        <Formik
          initialValues={{
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nombre"
                  name="firstName"
                  type="text"
                  placeholder="Juan"
                  required
                />
                <FormInput
                  label="Apellido"
                  name="lastName"
                  type="text"
                  placeholder="Pérez"
                  required
                />
              </div>
              
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
