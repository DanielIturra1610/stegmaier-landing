import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Página 404 - No encontrado
 * Diseñada con los principios de diseño de Stegmaier y transiciones sutiles
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 section-unified-bg section-hero-bg">
      <div className="content-overlay w-full max-w-xl text-center">
        <div className="mb-8">
          <img 
            src="/assets/images/Stegmaierlogo.png" 
            alt="Stegmaier Logo" 
            className="h-16 mx-auto mb-6" 
          />
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">404</h1>
          <div className="h-1 w-20 bg-white bg-opacity-30 mx-auto mb-6"></div>
          <h2 className="text-2xl md:text-3xl font-medium text-white mb-2">Página no encontrada</h2>
          <p className="text-primary-100 max-w-md mx-auto">
            La página que estás buscando no existe o ha sido movida a otra ubicación.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-primary-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Volver al inicio
          </Link>
          
          <Link 
            to="/platform"
            className="inline-flex items-center justify-center px-6 py-3 border border-white border-opacity-25 rounded-md text-base font-medium text-white bg-transparent hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          >
            Ir a la plataforma
          </Link>
        </div>
      </div>
      
      {/* Elemento decorativo que respeta el diseño sutil */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          viewBox="0 0 1440 60" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-10 md:h-14 fill-white fill-opacity-5"
          preserveAspectRatio="none"
        >
          <path d="M0,40 C240,20 480,0 720,0 C960,0 1200,20 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </div>
  );
};

export default NotFoundPage;
