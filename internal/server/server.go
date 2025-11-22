package server

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/controllers"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

const (
	// Token expiration durations
	verificationTokenExpiry   = 24 * time.Hour  // 24 hours for email verification
	passwordResetTokenExpiry  = 1 * time.Hour   // 1 hour for password reset
	bcryptCost               = 12               // Bcrypt cost factor
)

// Server representa el servidor Fiber con toda su configuración
type Server struct {
	app              *fiber.App
	config           *config.Config
	dbManager        *database.Manager
	authController   *controllers.AuthController
	userController   *controllers.UserManagementController
}

// New crea una nueva instancia del servidor con toda la configuración
func New(cfg *config.Config, dbManager *database.Manager) *Server {
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

	// Initialize dependency injection for auth module
	log.Println("🔧 Initializing authentication module...")

	// 1. Initialize shared utilities
	passwordHasher := hasher.NewBcryptHasher(bcryptCost)
	tokenService := tokens.NewJWTService(
		cfg.JWT.Secret,
		cfg.JWT.Expiration,
		"stegmaier-lms",
	)

	// 2. Initialize repositories (using Control DB from dbManager)
	controlDB := dbManager.GetControlDB()
	authRepo := adapters.NewPostgreSQLAuthRepository(controlDB)
	userRepo := adapters.NewPostgreSQLUserRepository(controlDB)

	// 3. Initialize services
	authService := services.NewAuthService(
		authRepo,
		passwordHasher,
		tokenService,
		services.AuthServiceConfig{
			AccessTokenExpiry:  cfg.JWT.Expiration,
			RefreshTokenExpiry: cfg.JWT.RefreshExpiration,
			VerifyTokenExpiry:  verificationTokenExpiry,
			ResetTokenExpiry:   passwordResetTokenExpiry,
		},
	)

	userManagementService := services.NewUserManagementService(
		authRepo,
		userRepo,
		passwordHasher,
	)

	// 4. Initialize controllers
	authController := controllers.NewAuthController(authService)
	userController := controllers.NewUserManagementController(userManagementService)

	log.Println("✅ Authentication module initialized")

	// Crear instancia del servidor
	server := &Server{
		app:            app,
		config:         cfg,
		dbManager:      dbManager,
		authController: authController,
		userController: userController,
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
		AllowOrigins:     strings.Join(s.config.Server.CORSOrigins, ","),
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
	// Health check endpoint (no tenant required)
	s.app.Get("/health", s.healthCheckHandler)

	// Root endpoint (no tenant required)
	s.app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Stegmaier Learning Platform API",
			"version": "1.0.0",
			"status":  "online",
		})
	})

	// API version group
	api := s.app.Group("/api")

	// Apply tenant middleware to all API routes
	// This will extract tenant_id and inject it into context
	api.Use(middleware.TenantMiddleware(s.dbManager))

	v1 := api.Group("/v1")

	// API health check (with tenant context)
	v1.Get("/health", s.tenantHealthCheckHandler)

	// ============================================================
	// Authentication Routes (Public - No auth middleware required)
	// ============================================================
	auth := v1.Group("/auth")
	{
		// Registration & Login
		auth.Post("/register", s.authController.Register)
		auth.Post("/login", s.authController.Login)

		// Email Verification
		auth.Post("/verify-email", s.authController.VerifyEmail)
		auth.Post("/resend-verification", s.authController.ResendVerification)

		// Password Reset Flow
		auth.Post("/forgot-password", s.authController.ForgotPassword)
		auth.Post("/reset-password", s.authController.ResetPassword)

		// Token Refresh (No auth middleware, just valid refresh token)
		auth.Post("/refresh", s.authController.RefreshToken)

		// Protected Auth Routes (TODO: Add auth middleware)
		// auth.Use(middleware.AuthMiddleware(tokenService))
		auth.Post("/logout", s.authController.Logout)
		auth.Post("/change-password", s.authController.ChangePassword)
		auth.Get("/me", s.authController.GetCurrentUser)
		auth.Put("/profile", s.authController.UpdateProfile)
		auth.Post("/revoke-sessions", s.authController.RevokeAllSessions)
	}

	// ============================================================
	// Admin Routes (Protected - Auth + RBAC middleware required)
	// ============================================================
	admin := v1.Group("/admin")
	// admin.Use(middleware.AuthMiddleware(tokenService))
	// admin.Use(middleware.RBACMiddleware("admin", "superadmin"))
	{
		// User Management
		users := admin.Group("/users")
		{
			// CRUD Operations
			users.Post("/", s.userController.CreateUser)
			users.Get("/", s.userController.ListUsers)
			users.Get("/:id", s.userController.GetUserByID)
			users.Put("/:id", s.userController.UpdateUser)
			users.Delete("/:id", s.userController.DeleteUser)

			// User Actions
			users.Post("/:id/verify", s.userController.VerifyUserByAdmin)
			users.Post("/:id/unverify", s.userController.UnverifyUser)
			users.Post("/:id/reset-password", s.userController.ResetUserPassword)
			users.Post("/:id/force-password-change", s.userController.ForcePasswordChange)

			// Queries by Role
			users.Get("/role/:role", s.userController.GetUsersByRole)
			users.Get("/role/:role/count", s.userController.CountUsersByRole)
		}

		// Tenant Management
		tenants := admin.Group("/tenants")
		{
			tenants.Get("/:tenantId/users", s.userController.GetUsersByTenant)
			tenants.Get("/:tenantId/users/count", s.userController.CountUsersByTenant)
		}
	}
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

// tenantHealthCheckHandler maneja el health check con contexto de tenant
func (s *Server) tenantHealthCheckHandler(c *fiber.Ctx) error {
	// Get tenant info from context
	tenantID := c.Locals(middleware.TenantIDKey)
	tenantSlug := c.Locals(middleware.TenantSlugKey)
	tenantName := c.Locals(middleware.TenantNameKey)

	// Check database health
	dbHealthy := true
	if err := s.dbManager.HealthCheck(); err != nil {
		dbHealthy = false
	}

	// Get cache stats
	cacheStats := middleware.GetCacheStats()

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"status":    "healthy",
		"timestamp": time.Now().Format(time.RFC3339),
		"service":   "stegmaier-api",
		"version":   "1.0.0",
		"tenant": fiber.Map{
			"id":   tenantID,
			"slug": tenantSlug,
			"name": tenantName,
		},
		"database": fiber.Map{
			"healthy": dbHealthy,
		},
		"cache": cacheStats,
	})
}

// Start inicia el servidor en el puerto configurado
func (s *Server) Start() error {
	addr := fmt.Sprintf(":%s", s.config.Server.Port)
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
