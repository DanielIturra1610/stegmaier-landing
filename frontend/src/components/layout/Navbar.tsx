// src/components/layout/Navbar.tsx
import { useState, useEffect, useRef } from 'react'
import React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar'
import { Menu, X, Phone, Calendar, LogIn, UserPlus, LogOut, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAuthModal } from '../../contexts/AuthModalContext'
import Button from '../ui/button'
import { AnimatePresence, motion } from 'framer-motion'
// @ts-ignore - Importar imágenes
import StegmaierLogo from '../../assets/images/Stegmaierlogo.png'
// @ts-ignore - Importar imágenes
import StegmaierLogoBlanco from '../../assets/images/Stegmaierlogoblanco.png'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Consultorías', href: '/consultorias' },
  { label: 'Empresa', href: '/empresa' },
] 

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState('/')
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const isFirstRender = useRef(true)
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    transition: 'none' // Inicialmente sin transición
  })
  
  // Obtener funciones y estado de autenticación
  const { isAuthenticated, isVerified, logout } = useAuth()
  // Obtener funciones para controlar el modal de autenticación
  const { openLoginModal, openRegisterModal } = useAuthModal()
  const location = useLocation()

  // Efecto para manejar el scroll y el cambio de tamaño de ventana
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    onScroll()
    
    // Manejador para el cambio de tamaño de ventana
    const onResize = () => {
      // Recalcular la posición del indicador cuando cambia el tamaño de la ventana
      // Añadimos un pequeño retraso para permitir que el DOM se actualice
      setTimeout(() => {
        updateIndicatorPosition(true)
      }, 50)
    }
    
    window.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Usamos eslint-disable porque updateIndicatorPosition se define después de este efecto
  
  // Efecto para actualizar la ruta actual cuando cambia la ubicación
  useEffect(() => {
    const path = location.pathname
    // Manejar rutas con hash
    if (location.hash) {
      setCurrentPath(path + location.hash)
    } else {
      setCurrentPath(path)
    }
  }, [location])
  
  // Efecto para actualizar la posición del indicador cuando cambia la ruta
  useEffect(() => {
    // Variable para determinar si es la primera carga
    const isInitialLoad: boolean = currentPath === location.pathname || 
                          (!!location.hash && currentPath === location.pathname + location.hash)
    
    // Dar tiempo a que las referencias se actualicen
    setTimeout(() => {
      // En la carga inicial, no queremos animación
      updateIndicatorPosition(isInitialLoad)
    }, 50)
  }, [currentPath, location])

  // Función para actualizar la posición del indicador
  const updateIndicatorPosition = (skipAnimation = false) => {
    // Encontrar el índice del enlace activo
    const activeIndex = NAV.findIndex(({ href }) => isActive(href))
    
    if (activeIndex !== -1 && navRefs.current[activeIndex]) {
      const activeLink = navRefs.current[activeIndex]
      if (activeLink) {
        // Obtener las dimensiones del enlace activo
        const { offsetLeft, offsetWidth } = activeLink
        
        // Si es el primer renderizado o si skipAnimation es true, no aplicamos transición
        if (isFirstRender.current || skipAnimation) {
          setIndicatorStyle({
            left: offsetLeft,
            width: offsetWidth,
            transition: 'none'
          })
        } else {
          // Para cambios de página posteriores, aplicamos la transición suave
          setIndicatorStyle({
            left: offsetLeft,
            width: offsetWidth,
            transition: 'none'
          })
        }
        
        // Después del primer renderizado, cambiamos el flag
        if (isFirstRender.current) {
          isFirstRender.current = false
        }
      }
    }
  }

  const isActive = (href: string) => {
    // Obtener la ruta sin hash
    const pathWithoutHash = currentPath?.split('#')[0] || ''
    
    // Manejo especial para la ruta principal
    if (href === '/') {
      return pathWithoutHash === '/' || pathWithoutHash === ''
    }
    
    // Para otras rutas, verificar coincidencia exacta
    return pathWithoutHash === href
  }

  const linkBase =
    `px-3 py-4 text-sm font-medium transition-colors relative group ${
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
    zIndex: 50,
  }

  return (
    <>
      {/* ---------- Navbar principal ---------- */}
      <header
        className="fixed top-0 left-0 right-0 w-full"
        style={navbarStyle}
      >
        <Toolbar.Root
          className="container mx-auto flex h-12 items-center justify-between px-4"
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
            {NAV.map(({ label, href }, index) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  to={href}
                  ref={el => navRefs.current[index] = el}
                  className={`${linkBase} ${active ? (scrolled ? 'text-primary-600 font-semibold' : 'text-white font-semibold') : ''}`}
                >
                  <span className="relative z-10">{label}</span>
                </Link>
              )
            })}
          </div>
          
          {/* CTAs escritorio */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Botones de autenticación */}
            <div className="flex items-center space-x-2 mr-2">
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={scrolled ? "text-primary-600 hover:bg-primary-50" : "text-white hover:text-white/90"}
                    asChild
                  >
                    <Link to={isVerified ? '/platform' : '/verify-reminder'} className="flex items-center">
                      <User className="w-4 h-4 mr-1.5" />
                      <span>{isVerified ? 'Mi Plataforma' : 'Verificar Email'}</span>
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={scrolled ? "text-gray-600 hover:bg-gray-50" : "text-gray-200 hover:bg-primary-700/30"}
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    <span>Salir</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={scrolled ? "text-gray-600 hover:bg-gray-50" : "text-gray-200 hover:bg-primary-700/30"}
                    onClick={openLoginModal}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Iniciar Sesión</span>
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-accent-500 text-white hover:bg-accent-600"
                    onClick={openRegisterModal}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    <span>Registrarse</span>
                  </Button>
                </>
              )}
            </div>
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
        
        {/* Indicador de página activa - posicionado en el borde inferior del navbar */}
        <div className="relative h-0">
          <div
            className="absolute h-[3px] bg-green-500 transition-all duration-300 ease-in-out"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              bottom: '-1px',
            }}
          />
        </div>
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
                      <Link
                        key={href}
                        to={href}
                        className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all mb-1 w-full ${
                          active 
                            ? 'bg-primary-50 text-primary-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                        }`}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              
              {/* Footer con acciones */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-3">
                {/* Botones de autenticación */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <Link
                      to={isVerified ? '/platform' : '/verify-reminder'}
                      className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                    >
                      <User className="w-4 h-4 mr-1.5" />
                      {isVerified ? 'Mi Plataforma' : 'Verificar Email'}
                    </Link>
                    <button
                      onClick={logout}
                      className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Cerrar Sesión
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={openLoginModal}
                      className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-primary-600 hover:bg-gray-50 transition-colors"
                    >
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={openRegisterModal}
                      className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                    >
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Registrarse
                    </button>
                  </div>
                )}
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
