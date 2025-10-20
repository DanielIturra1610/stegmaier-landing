import React from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ScrollProgressBar } from '../../hooks/ScrollProgressBar';
import { AuthModalProvider } from '../../contexts/AuthModalContext';
import AuthModal from '../auth/AuthModal';

export default function Layout({ children }: { children?: ReactNode }) {
  return (
    <AuthModalProvider>
      <div className="flex min-h-screen flex-col bg-stegmaier-gray-light relative">
      <ScrollProgressBar />
      <Navbar />
      
      {/* Fondo global cohesivo - Movido después del navbar */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradiente base suave */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 via-white to-accent-50/30" />
        
        {/* Patrones geométricos sutiles */}
        <div className="absolute inset-0 bg-grid-white bg-[length:80px_80px] opacity-[0.02]" />
        
        {/* Orbes decorativos flotantes - sin transform, solo animaciones de CSS puras */}
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-40 animate-pulse visual-effect-container">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-accent-100/20 rounded-full"></div>
        </div>
        <div className="absolute bottom-40 right-20 w-80 h-80 rounded-full opacity-30 animate-pulse visual-effect-container"
          style={{animationDelay: '2s'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-100/15 to-primary-100/15 rounded-full"></div>
        </div>
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-20 visual-effect-container"
          style={{top: '50%', left: '50%', marginLeft: '-300px', marginTop: '-300px'}}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/10 to-accent-50/10 rounded-full"></div>
        </div>
      </div>

      <main className="flex-grow relative">{children || <Outlet />}</main>
      <Footer />
      <AuthModal />
    </div>
    </AuthModalProvider>
  );
}