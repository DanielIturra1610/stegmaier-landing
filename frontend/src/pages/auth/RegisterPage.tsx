import React from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../../components/ui/AuthCard';
import RegisterForm from '../../components/auth/RegisterForm';

/**
 * Página de registro de usuario
 */
const RegisterPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <AuthCard
          title="Crear una cuenta"
          subtitle="Únete a la plataforma de cursos de Stegmaier"
          footer={
            <div className="text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Iniciar sesión
              </Link>
            </div>
          }
        >
          <RegisterForm />
        </AuthCard>
      </div>
    </div>
  );
};

export default RegisterPage;
