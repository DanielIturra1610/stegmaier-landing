import React from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../../components/ui/AuthCard';
import LoginForm from '../../components/auth/LoginForm';

/**
 * Página de inicio de sesión
 */
const LoginPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <AuthCard
          title="Iniciar sesión"
          subtitle="Accede a tu cuenta para continuar"
          footer={
            <div className="text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Registrarse
              </Link>
            </div>
          }
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  );
};

export default LoginPage;
