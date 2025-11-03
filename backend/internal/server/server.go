package server

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/controllers"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/services"
	courseadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/adapters"
	courseservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/services"
	profileadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/adapters"
	profileservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/services"
	useradapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/adapters"
	userservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/services"
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
	app                *fiber.App
	config             *config.Config
	dbManager          *database.Manager
	authController     *controllers.AuthController
	userController     *controllers.UserManagementController
	profileController  *controllers.ProfileController
	courseController   *controllers.CourseController
	categoryController *controllers.CategoryController
	tokenService       tokens.TokenService
	authRepo           ports.AuthRepository
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
	authUserRepo := adapters.NewPostgreSQLUserRepository(controlDB) // For profile service
	userRepo := useradapters.NewPostgreSQLUserRepository(controlDB)

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

	userManagementService := userservices.NewUserManagementService(
		authRepo,
		userRepo,
		passwordHasher,
	)

	// 4. Initialize controllers
	authController := controllers.NewAuthController(authService)
	userController := controllers.NewUserManagementController(userManagementService)

	log.Println("✅ Authentication module initialized")

	// Initialize dependency injection for profile module
	log.Println("🔧 Initializing profile module...")

	// 1. Initialize profile repository
	profileRepo := profileadapters.NewPostgreSQLProfileRepository(controlDB)

	// 2. Initialize file storage service
	// TODO: Move these to configuration
	uploadsPath := "./uploads"
	uploadsURL := fmt.Sprintf("http://localhost:%s/uploads", cfg.Server.Port)
	fileStorage, err := profileadapters.NewLocalFileStorage(uploadsPath, uploadsURL)
	if err != nil {
		log.Fatalf("❌ Failed to initialize file storage: %v", err)
	}

	// 3. Initialize profile service
	profileService := profileservices.NewProfileService(
		profileRepo,
		authRepo,     // Provides GetUserByID (AuthRepository)
		authUserRepo, // Provides ChangePassword (UserRepository)
		fileStorage,
		passwordHasher,
	)

	// 4. Initialize profile controller
	profileController := controllers.NewProfileController(profileService)

	log.Println("✅ Profile module initialized")

	// Initialize dependency injection for courses module
	log.Println("🔧 Initializing courses module...")

	// 1. Get tenant database connection
	// Note: For now we use control DB, but in production you'd want to get tenant DB dynamically
	tenantDB := dbManager.GetControlDB()

	// 2. Initialize course repositories
	courseRepo := courseadapters.NewPostgreSQLCourseRepository(tenantDB)
	categoryRepo := courseadapters.NewPostgreSQLCourseCategoryRepository(tenantDB)

	// 3. Initialize course services
	courseService := courseservices.NewCourseService(courseRepo, categoryRepo)
	categoryService := courseservices.NewCourseCategoryService(categoryRepo)

	// 4. Initialize course controllers
	courseController := controllers.NewCourseController(courseService)
	categoryController := controllers.NewCategoryController(categoryService)

	log.Println("✅ Courses module initialized")

	// Crear instancia del servidor
	server := &Server{
		app:                app,
		config:             cfg,
		dbManager:          dbManager,
		authController:     authController,
		userController:     userController,
		profileController:  profileController,
		courseController:   courseController,
		categoryController: categoryController,
		tokenService:       tokenService,
		authRepo:           authRepo,
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

	// Serve static files (uploaded avatars, etc.)
	s.app.Static("/uploads", "./uploads")

	// API version group
	api := s.app.Group("/api")

	// Apply tenant middleware to all API routes
	// This will extract tenant_id and inject it into context
	api.Use(middleware.TenantMiddleware(s.dbManager))

	v1 := api.Group("/v1")

	// API health check (with tenant context)
	v1.Get("/health", s.tenantHealthCheckHandler)

	// ============================================================
	// Authentication Routes
	// ============================================================
	auth := v1.Group("/auth")

	// Public Routes (No authentication required)
	auth.Post("/register", s.authController.Register)
	auth.Post("/login", s.authController.Login)
	auth.Post("/verify-email", s.authController.VerifyEmail)
	auth.Post("/resend-verification", s.authController.ResendVerification)
	auth.Post("/forgot-password", s.authController.ForgotPassword)
	auth.Post("/reset-password", s.authController.ResetPassword)
	auth.Post("/refresh", s.authController.RefreshToken)

	// Protected Routes (Authentication required)
	authProtected := auth.Group("")
	authProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	{
		authProtected.Post("/logout", s.authController.Logout)
		authProtected.Post("/change-password", s.authController.ChangePassword)
		authProtected.Get("/me", s.authController.GetCurrentUser)
		authProtected.Put("/profile", s.authController.UpdateProfile)
		authProtected.Post("/revoke-sessions", s.authController.RevokeAllSessions)
	}

	// ============================================================
	// Profile Routes (Protected - Authentication required)
	// ============================================================
	profile := v1.Group("/profile")
	profile.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	{
		profile.Get("/me", s.profileController.GetMyProfile)
		profile.Put("/me", s.profileController.UpdateMyProfile)
		profile.Post("/change-password", s.profileController.ChangePassword)
		profile.Post("/avatar", s.profileController.UploadAvatar)
		profile.Delete("/avatar", s.profileController.DeleteAvatar)
		profile.Put("/preferences", s.profileController.UpdatePreferences)
	}

	// ============================================================
	// Course Routes
	// ============================================================
	courses := v1.Group("/courses")

	// Public course routes (read-only, no auth required)
	{
		courses.Get("/published", s.courseController.GetPublishedCourses)
		courses.Get("/slug/:slug", s.courseController.GetCourseBySlug)
		courses.Get("/instructor/:instructorId", s.courseController.GetCoursesByInstructor)
		courses.Get("/category/:categoryId", s.courseController.GetCoursesByCategory)
		courses.Get("/:id", s.courseController.GetCourse)
		courses.Get("/", s.courseController.ListCourses)
	}

	// Protected course routes (authentication required)
	coursesProtected := courses.Group("")
	coursesProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	{
		// Student actions
		coursesProtected.Post("/:id/enroll", s.courseController.EnrollCourse)
		coursesProtected.Post("/:id/unenroll", s.courseController.UnenrollCourse)
		coursesProtected.Post("/:id/rate", s.courseController.RateCourse)

		// Instructor/Admin actions (TODO: Add instructor/admin middleware)
		coursesProtected.Post("/", s.courseController.CreateCourse)
		coursesProtected.Put("/:id", s.courseController.UpdateCourse)
		coursesProtected.Delete("/:id", s.courseController.DeleteCourse)
		coursesProtected.Post("/:id/publish", s.courseController.PublishCourse)
		coursesProtected.Post("/:id/unpublish", s.courseController.UnpublishCourse)
		coursesProtected.Post("/:id/archive", s.courseController.ArchiveCourse)
	}

	// ============================================================
	// Category Routes
	// ============================================================
	categories := v1.Group("/categories")

	// Public category routes (read-only, no auth required)
	{
		categories.Get("/active", s.categoryController.ListActiveCategories)
		categories.Get("/slug/:slug", s.categoryController.GetCategoryBySlug)
		categories.Get("/:id/subcategories", s.categoryController.GetSubcategories)
		categories.Get("/:id", s.categoryController.GetCategory)
		categories.Get("/", s.categoryController.ListCategories)
	}

	// Protected category routes (admin only)
	categoriesProtected := categories.Group("")
	categoriesProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	categoriesProtected.Use(middleware.RequireAdmin())
	{
		categoriesProtected.Post("/", s.categoryController.CreateCategory)
		categoriesProtected.Put("/:id", s.categoryController.UpdateCategory)
		categoriesProtected.Delete("/:id", s.categoryController.DeleteCategory)
		categoriesProtected.Post("/:id/activate", s.categoryController.ActivateCategory)
		categoriesProtected.Post("/:id/deactivate", s.categoryController.DeactivateCategory)
	}

	// ============================================================
	// Admin Routes (Protected - Authentication + RBAC required)
	// ============================================================
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	admin.Use(middleware.RequireAdmin()) // Requires admin or higher (superadmin)

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

	// Profile Management (Admin only)
	profiles := admin.Group("/profiles")
	{
		profiles.Get("/:id", s.profileController.GetProfile)
		profiles.Put("/:id", s.profileController.UpdateProfile)
	}

	// ============================================================
	// SuperAdmin Routes (Protected - SuperAdmin only)
	// ============================================================
	superadmin := v1.Group("/superadmin")
	superadmin.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	superadmin.Use(middleware.RequireSuperAdmin()) // Requires superadmin role only

	// Tenant Management (SuperAdmin only - critical operations)
	tenants := superadmin.Group("/tenants")
	{
		tenants.Get("/:tenantId/users", s.userController.GetUsersByTenant)
		tenants.Get("/:tenantId/users/count", s.userController.CountUsersByTenant)
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
