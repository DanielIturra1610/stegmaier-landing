// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { Menu, X, Phone, Calendar } from 'lucide-react'
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
    `px-3 py-2 text-sm font-medium transition-colors data-[state=active]:text-primary-600 relative group ${
      scrolled ? 'text-gray-700' : 'text-white'
    }`

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
                className="w-36 h-10 object-contain"
              />
            </div>
          </a>

          {/* desktop links */}
          <div className="hidden md:flex items-center space-x-1">
            {NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className={linkBase}
              >
                {label}
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-primary-500 scale-x-0 group-hover:scale-x-100 origin-center transition-transform" />
              </a>
            ))}
          </div>
          
          {/* desktop CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className={scrolled ? "text-gray-700" : "text-white hover:text-white/90"}
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
          
          {/* mobile menu toggle */}
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <Dropdown.Trigger asChild>
              <button
                className={`md:hidden rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  scrolled ? 'text-gray-700' : 'text-white'
                }`}
                aria-label="Abrir menú"
              >
                {open ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content
                align="end"
                sideOffset={8}
                className="md:hidden w-screen max-w-[280px] rounded-xl bg-white p-4 shadow-lg border border-gray-100 z-[100] fixed right-4 top-16"
                style={{
                  maxHeight: 'calc(100vh - 80px)', 
                  overflowY: 'auto',
                  display: open ? 'block' : 'none'
                }}
              >
                <div className="mb-4 flex items-center">
                  <img 
                    src={StegmaierLogo} 
                    alt="Stegmaier Consulting Logo" 
                    className="w-7 h-7 object-contain mr-2"
                  />
                  <span className="font-heading text-lg font-bold text-primary-600">Stegmaier</span>
                  <span className="text-xs font-medium text-gray-500 ml-1">Consulting</span>
                </div>
                {NAV.map(({ label, href }) => (
                  <Dropdown.Item key={href}>
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
                  <Dropdown.Item>
                    <a href="/cotizar" className="block w-full rounded-lg bg-accent-500 hover:bg-accent-600 px-4 py-2 text-sm font-medium text-white text-center">
                      Cotización Gratuita
                    </a>
                  </Dropdown.Item>
                  <Dropdown.Item>
                    <a href="/calendario" className="block w-full rounded-lg border border-gray-300 hover:bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 text-center mt-2">
                      Agendar Reunión
                    </a>
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
