// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Phone, Calendar, Award } from 'lucide-react'
import Button from '../ui/button'
import StegmaierLogo from '../../assets/images/Stegmaierlogo.png'
import StegmaierLogoBlanco from '../../assets/images/Stegmaierlogoblanco.png'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Consultorías ISO', href: '/consultorias' },
  { label: 'Normativas', href: '/normativas' },
  { label: 'Proceso', href: '/#proceso' },
  { label: 'Casos de Éxito', href: '/casos' },
  { label: 'Empresa', href: '/empresa' },
  { label: 'Contacto', href: '/#contacto' },
]

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkBase =
    'px-3 py-2 text-sm font-medium transition-colors data-[state=active]:text-primary-600 relative group'

  return (
    <>
      {/* ---------- Barra de progreso de scroll ---------- */}
      {/* la añade Layout (ver abajo) */}

      {/* ---------- Navbar ---------- */}
      <header
        className={`fixed inset-x-0 z-50 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
        } transition-all duration-300`}
      >
        <Toolbar.Root
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Menú principal"
        >
          {/* logo - modernized with visual elements */}
          <a href="/" className="flex items-center group">
            <div className="relative w-36 h-42 flex items-center justify-center">
              <img 
                src={scrolled ? StegmaierLogo : StegmaierLogoBlanco} 
                alt="Stegmaier Consulting Logo" 
                className="w-full h-full object-contain transition-opacity duration-300"
              />
            </div>
          </a>

          {/* -------- Desktop nav - enhanced with hover effects -------- */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className={`${linkBase} ${
                  scrolled ? 'text-gray-700 hover:text-primary-700' : 'text-white hover:text-primary-100'
                }`}
              >
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-500 group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}

            {/* Quick contact buttons */}
            <div className="flex items-center gap-3 border-l ml-4 pl-4 border-gray-200/20">
              <a 
                href="tel:+56223456789" 
                className={`flex items-center ${scrolled ? 'text-primary-600' : 'text-white'} hover:opacity-80 transition-opacity`}
                title="Llámanos"
              >
                <Phone className="w-4 h-4" />
              </a>
              <a 
                href="/calendario" 
                className={`flex items-center ${scrolled ? 'text-primary-600' : 'text-white'} hover:opacity-80 transition-opacity`}
                title="Agendar reunión"
              >
                <Calendar className="w-4 h-4" />
              </a>
            </div>
            
            {/* CTA Button - more prominent */}
            <Button 
              size="sm" 
              className={`ml-3 ${scrolled ? 'bg-accent-500' : 'bg-accent-500'} hover:bg-accent-600 hover:shadow-lg hover:shadow-accent-500/20 transition-all`}
            >
              <a href="/cotizar">Cotización Gratuita</a>
            </Button>
          </nav>

          {/* -------- Mobile button - enhanced -------- */}
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <Dropdown.Trigger asChild>
              <button
                className={`md:hidden rounded-lg p-2 ${
                  scrolled ? 'bg-gray-100 text-primary-600' : 'bg-white/10 text-white'
                } hover:bg-opacity-80 focus:outline-none transition-all duration-300`}
                aria-label="Abrir menú"
              >
                <AnimatePresence initial={false} mode="wait">
                  {open ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Dropdown.Trigger>

            {/* ---------- Mobile dropdown ---------- */}
            <Dropdown.Portal>
              <Dropdown.Content
                sideOffset={6}
                align="end"
                className="w-64 rounded-xl bg-white p-4 shadow-elevated border border-gray-100 data-[state=open]:animate-in data-[state=closed]:animate-out"
              >
                {/* Mobile logo */}
                <div className="flex items-center mb-4 pb-3 border-b border-gray-100">
                  <img 
                    src={scrolled ? StegmaierLogo : StegmaierLogoBlanco} 
                    alt="Stegmaier Consulting Logo" 
                    className="w-7 h-7 object-contain mr-2"
                  />
                  <span className="font-heading text-lg font-bold text-primary-600">Stegmaier</span>
                  <span className="text-xs font-medium text-gray-500 ml-1">Consulting</span>
                </div>
                {NAV.map(({ label, href }) => (
                  <Dropdown.Item key={href} asChild>
                    <a
                      href={href}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-primary-50 hover:text-primary-700 mb-1"
                    >
                      {label}
                    </a>
                  </Dropdown.Item>
                ))}
                <Dropdown.Separator className="my-3 h-px bg-gray-100" />
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500 mb-2 px-2">
                    <Phone className="w-4 h-4 mr-2 text-primary-500" />
                    <a href="tel:+56223456789" className="hover:text-primary-600">+56 2 2345 6789</a>
                  </div>
                  <Dropdown.Item asChild>
                    <Button size="sm" className="w-full justify-center bg-accent-500 hover:bg-accent-600">
                      <a href="/cotizar">Cotización Gratuita</a>
                    </Button>
                  </Dropdown.Item>
                  <Dropdown.Item asChild>
                    <Button size="sm" className="w-full justify-center mt-2" variant="ghost">
                      <a href="/calendario">Agendar Reunión</a>
                    </Button>
                  </Dropdown.Item>
                </div>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </Toolbar.Root>
      </header>
    </>
  )
}

export default Navbar
