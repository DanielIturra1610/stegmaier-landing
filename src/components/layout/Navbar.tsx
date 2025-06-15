// src/components/layout/Navbar.tsx
import { useState, useEffect } from 'react'
import * as Toolbar from '@radix-ui/react-toolbar'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Button from '../ui/button'

const NAV = [
  { label: 'Inicio', href: '/' },
  { label: 'Consultorías', href: '/consultorias' },
  { label: 'Normativas', href: '/normativas' },
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
    'px-3 py-2 text-sm font-medium transition-colors data-[state=active]:text-primary-600'

  return (
    <>
      {/* ---------- Barra de progreso de scroll ---------- */}
      {/* la añade Layout (ver abajo) */}

      {/* ---------- Navbar ---------- */}
      <header
        className={`fixed inset-x-0 z-50 ${
          scrolled ? 'bg-white/90 backdrop-blur shadow' : 'bg-transparent'
        }`}
      >
        <Toolbar.Root
          className="container mx-auto flex h-16 items-center justify-between px-4"
          aria-label="Menú principal"
        >
          {/* logo */}
          <a href="/" className="flex items-end space-x-1">
            <span
              className={`font-heading text-xl font-bold ${
                scrolled ? 'text-primary-700' : 'text-white'
              }`}
            >
              Stegmaier
            </span>
            <span
              className={`text-sm font-semibold ${
                scrolled ? 'text-gray-500' : 'text-blue-200'
              }`}
            >
              Consulting
            </span>
          </a>

          {/* -------- Desktop nav -------- */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className={`${linkBase} ${
                  scrolled ? 'text-gray-700 hover:text-primary-700' : 'text-white hover:text-primary-100'
                }`}
              >
                {label}
              </a>
            ))}

            <Button size="sm" className="ml-2">
              <a href="/cotizar">Cotizar</a>
            </Button>
          </nav>

          {/* -------- Mobile button -------- */}
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <Dropdown.Trigger asChild>
              <button
                className={`md:hidden rounded p-2 ${
                  scrolled ? 'text-gray-700' : 'text-white'
                } focus:outline-none`}
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
                className="w-56 rounded-lg bg-white p-2 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out"
              >
                {NAV.map(({ label, href }) => (
                  <Dropdown.Item key={href} asChild>
                    <a
                      href={href}
                      className="block rounded px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                      {label}
                    </a>
                  </Dropdown.Item>
                ))}
                <Dropdown.Separator className="my-1 h-px bg-gray-100" />
                <Dropdown.Item asChild>
                  <Button size="sm" className="w-full justify-center">
                    <a href="/cotizar">Cotizar</a>
                  </Button>
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </Toolbar.Root>
      </header>
    </>
  )
}

export default Navbar
