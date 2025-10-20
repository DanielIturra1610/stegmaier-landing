import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Esquema de validación para el formulario de login
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: Yup.string()
    .required('Contraseña es requerida')
});

// Esquema de validación para el formulario de registro
const registerSchema = Yup.object().shape({
  firstName: Yup.string()
    .required('Nombre es requerido'),
  lastName: Yup.string()
    .required('Apellido es requerido'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: Yup.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('Contraseña es requerida'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('Confirmar contraseña es requerido')
});

// Interfaces para los formularios
interface LoginFormValues {
  email: string;
  password: string;
  auth?: string; // Campo para errores generales
}

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  auth?: string; // Campo para errores generales
}

const AuthModal: React.FC = () => {
  const { modalType, closeModal, isModalOpen, openLoginModal, openRegisterModal, setModalType } = useAuthModal();
  const { login, register, verifyEmail, resendVerification } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  
  // Usar location para detectar tokens de verificación en la URL
  const location = useLocation();
  
  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    
    if (isModalOpen) {
      document.addEventListener('keydown', handleEsc);
      // Bloquear scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      // Restaurar scroll cuando se cierra el modal
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, closeModal]);
  
  // Detectar token de verificación en la URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    
    if (token && token.length > 0) {
      // Si hay un token en la URL, abrir el modal con la vista de verificación
      openLoginModal(); // Abre el modal
      setModalType('verification'); // Cambia a la vista de verificación
      handleVerifyEmail(token); // Inicia verificación
    }
  }, [location, openLoginModal, setModalType]);

  // Manejar clic fuera del modal para cerrarlo
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeModal();
  };

  
  // Manejar envío del formulario de login
  const handleLogin = async (values: LoginFormValues, { setSubmitting, setErrors }: any) => {
    try {
      await login(values);
      closeModal();
    } catch (error: any) {
      setErrors({ auth: error.message || 'Error al iniciar sesión' });
    } finally {
      setSubmitting(false);
    }
  };

  // Manejar envío del formulario de registro
  const handleRegister = async (values: RegisterFormValues, { setSubmitting, setErrors }: any) => {
    try {
      const { firstName, lastName, email, password } = values;
      await register({ firstName, lastName, email, password });
      
      // Cambiar al modal de verificación después del registro exitoso
      setModalType('verification');
      setVerificationStatus('success');
      setVerificationMessage('Te hemos enviado un correo de verificación. Por favor revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.');
      setVerificationEmail(email);
    } catch (error: any) {
      setErrors({ auth: error.message || 'Error al registrarse' });
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar entre modales
  const toggleModal = () => {
    if (modalType === 'login') {
      openRegisterModal();
    } else if (modalType === 'register' || modalType === 'verification') {
      openLoginModal();
    }
  };
  
  // Función para verificar el email con token
  const handleVerifyEmail = async (token: string) => {
    setVerificationLoading(true);
    setVerificationStatus('pending');
    
    try {
      const success = await verifyEmail(token);
      if (success) {
        setVerificationStatus('success');
        setVerificationMessage('Tu email ha sido verificado correctamente. Ya puedes iniciar sesión.');
      } else {
        setVerificationStatus('failed');
        setVerificationMessage('No se pudo verificar tu email. El token puede ser inválido o haber expirado.');
      }
    } catch (error: any) {
      setVerificationStatus('failed');
      setVerificationMessage('Ha ocurrido un error al verificar tu email. El token puede ser inválido o haber expirado.');
    } finally {
      setVerificationLoading(false);
    }
  };
  
  // Función para reenviar email de verificación
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      setVerificationMessage('Por favor ingresa tu email');
      return;
    }
    
    setVerificationLoading(true);
    
    try {
      const success = await resendVerification(verificationEmail);
      if (success) {
        setVerificationStatus('success');
        setVerificationMessage('Hemos enviado un nuevo email de verificación. Por favor revisa tu bandeja de entrada.');
      } else {
        setVerificationStatus('failed');
        setVerificationMessage('No se pudo reenviar el email de verificación.');
      }
    } catch (error: any) {
      setVerificationMessage('Ha ocurrido un error al reenviar el email de verificación.');
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-900/70 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-primary-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Decoración superior */}
            <div className="h-2 bg-gradient-to-r from-primary-700 via-accent-500 to-primary-700"></div>
            
            <div className="p-6 sm:p-8">
              {/* Header del modal */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalType === 'login' ? 'Iniciar sesión' : 
                   modalType === 'register' ? 'Crear cuenta' : 
                   'Verificación de email'}
                </h2>
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Formulario de login, registro o verificación */}
              {modalType === 'verification' ? (
                <div>
                  {verificationLoading ? (
                    <div className="flex flex-col items-center py-8">
                      <svg className="animate-spin h-10 w-10 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-4 text-gray-600 dark:text-gray-300">Verificando tu email...</p>
                    </div>
                  ) : verificationStatus === 'success' ? (
                    <div className="space-y-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-300 text-sm">
                        <div className="flex items-center">
                          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <p>{verificationMessage}</p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setModalType('login')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors"
                      >
                        Ir a iniciar sesión
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 text-sm">
                        <p>{verificationMessage}</p>
                      </div>
                      
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Ingresa tu email para recibir un nuevo enlace de verificación:</p>
                        
                        <div className="flex">
                          <input
                            type="email"
                            value={verificationEmail}
                            onChange={(e) => setVerificationEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={handleResendVerification}
                            disabled={verificationLoading}
                            className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-r-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Reenviar
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setModalType('login')}
                          className="text-sm font-medium text-accent-500 hover:text-accent-400"
                        >
                          Volver a iniciar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : modalType === 'login' ? (
                <Formik
                  initialValues={{ email: '', password: '', auth: undefined } as LoginFormValues}
                  validationSchema={loginSchema}
                  onSubmit={handleLogin}
                >
                  {({ isSubmitting, errors }) => (
                    <Form className="space-y-4">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          placeholder="tu@email.com"
                        />
                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contraseña
                        </label>
                        <Field
                          type="password"
                          name="password"
                          id="password"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          placeholder="••••••••"
                        />
                        <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-500" />
                      </div>
                      
                      {errors.auth && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 text-sm">
                          {errors.auth}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-accent-500 focus:ring-accent-500 border-gray-300 rounded"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Recordarme
                          </label>
                        </div>
                        <div className="text-sm">
                          <a href="#" className="font-medium text-accent-500 hover:text-accent-400">
                            ¿Olvidaste tu contraseña?
                          </a>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : 'Iniciar Sesión'}
                      </button>
                    </Form>
                  )}
                </Formik>
              ) : (
                <Formik
                  initialValues={{ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', auth: undefined } as RegisterFormValues}
                  validationSchema={registerSchema}
                  onSubmit={handleRegister}
                >
                  {({ isSubmitting, errors }) => (
                    <Form className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre
                          </label>
                          <Field
                            type="text"
                            name="firstName"
                            id="firstName"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                            placeholder="Juan"
                          />
                          <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Apellido
                          </label>
                          <Field
                            type="text"
                            name="lastName"
                            id="lastName"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                            placeholder="Pérez"
                          />
                          <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-500" />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          placeholder="tu@email.com"
                        />
                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-500" />
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contraseña
                        </label>
                        <Field
                          type="password"
                          name="password"
                          id="password"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          placeholder="••••••••"
                        />
                        <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-500" />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirmar contraseña
                        </label>
                        <Field
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-accent-500 focus:border-accent-500 bg-white dark:bg-primary-700 text-gray-900 dark:text-white"
                          placeholder="••••••••"
                        />
                        <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-500" />
                      </div>
                      
                      {errors.auth && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md text-red-800 dark:text-red-300 text-sm">
                          {errors.auth}
                        </div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : 'Crear Cuenta'}
                      </button>
                    </Form>
                  )}
                </Formik>
              )}
              
              {/* Footer del modal */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {modalType === 'login' ? '¿No tienes una cuenta?' : 
                   modalType === 'register' ? '¿Ya tienes una cuenta?' : ''}
                  {(modalType === 'login' || modalType === 'register') && (
                    <button
                      type="button"
                      onClick={toggleModal}
                      className="ml-1 font-medium text-accent-500 hover:text-accent-400 focus:outline-none"
                    >
                      {modalType === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                  )}
                </p>
                {modalType === 'login' && (
                  <button
                    type="button"
                    onClick={() => setModalType('verification')}
                    className="mt-2 text-xs font-medium text-accent-500 hover:text-accent-400 focus:outline-none"
                  >
                    ¿No has verificado tu email? Verifica aquí
                  </button>
                )}
              </div>
            </div>
            
            {/* Decoración inferior */}
            <div className="h-2 bg-gradient-to-r from-primary-700 via-accent-500 to-primary-700"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
