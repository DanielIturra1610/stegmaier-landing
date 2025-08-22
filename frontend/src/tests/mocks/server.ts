/**
 * MSW Server Configuration - Mock/**
 * MSW Server setup para testing
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// Configuración del servidor en development mode
if (process.env.NODE_ENV === 'development') {
  // Habilitar logging de requests en desarrollo
  server.events.on('request:start', ({ request }) => {
    console.log('MSW intercepted:', request.method, request.url)
  })
}

// Configuración para testing
server.events.on('request:unhandled', ({ request }) => {
  console.warn(`MSW: Unhandled request: ${request.method} ${request.url}`)
})
