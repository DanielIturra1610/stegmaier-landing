import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PlatformNavbar from './PlatformNavbar';
import PlatformSidebar from './PlatformSidebar';

/**
 * Layout para la plataforma de cursos (área protegida)
 * Incluye una barra de navegación superior y un sidebar lateral
 */
const PlatformLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar para navegación de la plataforma */}
      <PlatformSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1">
        {/* Navbar de la plataforma */}
        <PlatformNavbar onMenuClick={toggleSidebar} />
        
        {/* Contenido dinámico */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Footer simple para la plataforma */}
        <footer className="bg-white border-t border-gray-200 py-3">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Stegmaier. Todos los derechos reservados.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PlatformLayout;
