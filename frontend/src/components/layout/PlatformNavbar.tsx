import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PlatformNavbarProps {
  onMenuClick: () => void;
}

/**
 * Barra de navegación superior para la plataforma de cursos
 */
const PlatformNavbar: React.FC<PlatformNavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Botón de menú móvil */}
          <div className="lg:hidden">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Abrir menú lateral"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          
          {/* Logo */}
          <div className="flex-1 flex lg:hidden">
            <Link to="/platform" className="flex items-center justify-center">
              <img
                src="/assets/images/Stegmaierlogo.png"
                alt="Stegmaier"
                className="h-8"
              />
            </Link>
          </div>
          
          {/* Título de la página en dispositivos grandes */}
          <div className="hidden lg:flex flex-1 text-xl font-semibold text-gray-800">
            Plataforma de Cursos
          </div>
          
          {/* Barra de búsqueda */}
          <div className="hidden md:block flex-1 px-4">
            <div className="max-w-md w-full">
              <label htmlFor="search" className="sr-only">Buscar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full bg-gray-50 border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Buscar cursos..."
                  type="search"
                />
              </div>
            </div>
          </div>
          
          {/* Menú de usuario simplificado */}
          <div className="flex items-center">
            {/* Ícono de notificaciones */}
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Ver notificaciones"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v0.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Barra de búsqueda móvil */}
      <div className="md:hidden border-t border-gray-200 p-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            id="search-mobile"
            name="search-mobile"
            className="block w-full bg-gray-50 border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Buscar cursos..."
            type="search"
          />
        </div>
      </div>
    </header>
  );
};

export default PlatformNavbar;
