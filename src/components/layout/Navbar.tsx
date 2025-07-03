// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import { Menu, X, Phone, Calendar } from 'lucide-react'
import Button from '../ui/button'
import StegmaierLogo from '../../assets/images/Stegmaierlogo.png'
import StegmaierLogoBlanco from '../../assets/images/Stegmaierlogoblanco.png'
import { AnimatePresence, motion } from 'framer-motion'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Consultorías ISO', href: '/consultorias' },
  { label: 'Empresa', href: '/empresa' },
]

// Hook personalizado para detectar el tamaño de la ventana
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 768,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return windowSize;
};

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    onScroll()
    window.addEventListener('scroll', onScroll)
    
    // Detectar la ruta actual
    const path = window.location.pathname
    // Manejar rutas con hash
    if (window.location.hash) {
      setCurrentPath(path + window.location.hash)
    } else {
      setCurrentPath(path)
    }
    
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (href: string) => {
    // Manejo especial para la ruta principal
    if (href === '/' && currentPath === '/') return true
    
    // Para otras rutas, verificar si coinciden exactamente o si es una ruta con hash
    if (href !== '/') {
      return currentPath === href || (href.includes('#') && currentPath.includes(href))
    }
    
    return false
  }

  const linkBase =
    `px-3 py-2 text-sm font-medium transition-colors relative group ${
      scrolled ? 'text-primary-700' : 'text-white'
    }`

  // Estilo profesional con fondo claro y sutil
  const navbarStyle = {
    background: scrolled ? 'rgba(255, 255, 255, 0.92)' : 'transparent',
    backdropFilter: scrolled ? 'blur(4px)' : 'none',
    WebkitBackdropFilter: scrolled ? 'blur(4px)' : 'none',
    boxShadow: scrolled ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(226, 232, 240, 0.9)' : 'none',
    transition: 'all 0.2s ease-out',
    width: '100%',
    zIndex: 50
  }

  return (
    <>
      {/* ---------- Navbar principal ---------- */}
      <header
        className="fixed top-0 left-0 right-0 w-full"
        style={navbarStyle}
      >
        <Toolbar.Root
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Menú principal"
        >
          {/* Logo */}
          <a href="/" className="flex items-center z-20 relative">
            <div className="w-36 h-10 flex items-center justify-center">
              <img 
                src={scrolled ? StegmaierLogo : StegmaierLogoBlanco} 
                alt="Stegmaier Consulting Logo" 
                className="w-36 h-10 object-contain"
              />
            </div>
          </a>

          {/* Links escritorio */}
          <div className="hidden md:flex items-center justify-center space-x-4 flex-1 ml-8">
            {NAV.map(({ label, href }) => {
              const active = isActive(href)
              return (
                <a
                  key={href}
                  href={href}
                  className={`${linkBase} ${active ? (scrolled ? 'text-primary-600 font-semibold' : 'text-white font-semibold') : ''}`}
                >
                  {label}
                  <span className={`absolute left-0 right-0 bottom-0 h-[2px] bg-primary-500 transition-transform ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} origin-center`} />
                </a>
              )
            })}
          </div>
          
          {/* CTAs escritorio */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className={scrolled ? "text-primary-600 hover:bg-primary-50" : "text-white hover:text-white/90"}
              asChild
            >
              <a href="/calendario" className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                <span>Agendar</span>
              </a>
            </Button>
            <Button 
              size="sm"
              asChild
              className={!scrolled ? "text-primary-700 hover:bg-white/90" : ""}
            >
              <a href="/cotizar" className="flex items-center">
                <span>Cotización</span>
              </a>
            </Button>
          </div>
          
          {/* Botón de menú móvil */}
          <button
            className={`md:hidden rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 z-50 relative ${
              scrolled ? 'text-primary-600' : 'text-white'
            }`}
            onClick={() => setOpen(!open)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            style={{ position: 'relative', zIndex: 50 }}
          >
            {open ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </Toolbar.Root>
      </header>
      
      {/* Menú móvil (fuera del header para evitar conflictos) */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] md:hidden">
            {/* Overlay oscuro */}
            <motion.div 
              className="fixed inset-0 bg-black/50 z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            
            {/* Panel deslizante */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[280px] bg-white shadow-xl z-[110] flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              {/* Header del menú */}
              <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="font-heading text-lg font-bold text-primary-600">Stegmaier</span>
                  <span className="text-xs font-medium text-gray-500 ml-1">Consulting</span>
                </div>
                <button 
                  className="rounded-lg p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Contenido del menú */}
              <div className="flex-1 overflow-y-auto py-3">
                <nav className="px-2">
                  {NAV.map(({ label, href }) => {
                    const active = isActive(href);
                    return (
                      <a
                        key={href}
                        href={href}
                        className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all mb-1 w-full ${
                          active 
                            ? 'bg-primary-50 text-primary-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </a>
                    );
                  })}
                </nav>
              </div>
              
              {/* Footer con acciones */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center text-sm text-gray-600 mb-3 px-2">
                  <Phone className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0" />
                  <a href="tel:+56223456789" className="hover:text-primary-600 truncate">
                    +56 2 2345 6789
                  </a>
                </div>
                <a 
                  href="/cotizar" 
                  className="flex justify-center w-full rounded-lg bg-accent-500 hover:bg-accent-600 active:bg-accent-700 px-4 py-2.5 text-sm font-medium text-white text-center transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Cotización Gratuita
                </a>
                <a 
                  href="/calendario" 
                  className="flex items-center justify-center w-full rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 px-4 py-2.5 text-sm font-medium text-primary-600 text-center transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Agendar Reunión
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
