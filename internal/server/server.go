package server

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

// Server representa el servidor Fiber con toda su configuración
type Server struct {
	app *fiber.App
}

// New crea una nueva instancia del servidor con toda la configuración
func New() *Server {
	// Configuración de Fiber
	app := fiber.New(fiber.Config{
		AppName:               "Stegmaier Learning Platform API",
		ServerHeader:          "Fiber",
		StrictRouting:         false,
		CaseSensitive:        false,
		EnablePrintRoutes:    true,
		DisableStartupMessage: false,
		// Timeouts
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
		// Error handling
		ErrorHandler: customErrorHandler,
	})

	// Crear instancia del servidor
	server := &Server{
		app: app,
	}

	// Setup de middlewares
	server.setupMiddlewares()

	// Setup de rutas
	server.setupRoutes()

	return server
}

// setupMiddlewares configura todos los middlewares del servidor
func (s *Server) setupMiddlewares() {
	// Recover middleware - recupera de panics
	s.app.Use(recover.New(recover.Config{
		EnableStackTrace: true,
	}))

	// Logger middleware - logs estructurados
	s.app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} | ${path} | ${error}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "America/Santiago",
		Output:     os.Stdout,
	}))

	// CORS middleware
	s.app.Use(cors.New(cors.Config{
		AllowOrigins:     getAllowedOrigins(),
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Tenant-ID",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length, Content-Type",
		MaxAge:           3600,
	}))

	// Rate limiting middleware
	s.app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			// Rate limit por IP
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":   "Too Many Requests",
				"message": "Rate limit exceeded. Please try again later.",
			})
		},
	}))
}

// setupRoutes configura todas las rutas de la API
func (s *Server) setupRoutes() {
	// API version group
	api := s.app.Group("/api")
	v1 := api.Group("/v1")

	// Health check endpoint
	s.app.Get("/health", s.healthCheckHandler)

	// API health check
	v1.Get("/health", s.healthCheckHandler)

	// Root endpoint
	s.app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Stegmaier Learning Platform API",
			"version": "1.0.0",
			"status":  "online",
		})
	})

	// TODO: Aquí se registrarán los controllers de cada módulo
	// Ejemplo:
	// auth := v1.Group("/auth")
	// authController.RegisterRoutes(auth)
}

// healthCheckHandler maneja el health check endpoint
func (s *Server) healthCheckHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "stegmaier-api",
		"version":   "1.0.0",
	})
}

// Start inicia el servidor en el puerto especificado
func (s *Server) Start(port string) error {
	addr := fmt.Sprintf(":%s", port)
	log.Printf("🚀 Starting server on http://localhost%s", addr)
	log.Printf("📊 Health check available at http://localhost%s/health", addr)
	log.Printf("📚 API endpoints at http://localhost%s/api/v1", addr)

	return s.app.Listen(addr)
}

// Shutdown apaga el servidor gracefully
func (s *Server) Shutdown() error {
	log.Println("🛑 Shutting down server...")
	return s.app.Shutdown()
}

// GetApp retorna la instancia de Fiber (útil para testing)
func (s *Server) GetApp() *fiber.App {
	return s.app
}

// getAllowedOrigins retorna los orígenes permitidos para CORS
func getAllowedOrigins() string {
	// Por defecto, permitir localhost en desarrollo
	origins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if origins == "" {
		// Defaults para desarrollo
		origins = "http://localhost:3000,http://localhost:5173,http://localhost:8000"
	}
	return origins
}

// customErrorHandler maneja errores personalizados
func customErrorHandler(c *fiber.Ctx, err error) error {
	// Status code por defecto 500
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a fiber.*Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Log error
	log.Printf("❌ Error: %v | Path: %s | Method: %s", err, c.Path(), c.Method())

	// Retornar respuesta JSON
	return c.Status(code).JSON(fiber.Map{
		"error":   true,
		"message": err.Error(),
		"path":    c.Path(),
		"method":  c.Method(),
	})
}
