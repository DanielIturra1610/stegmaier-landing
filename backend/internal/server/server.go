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
	lessonadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/adapters"
	lessonservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/services"
	profileadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/adapters"
	profileservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/services"
	quizadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/adapters"
	quizservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/services"
	assignmentadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/adapters"
	assignmentservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/services"
	notificationadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/adapters"
	notificationservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/services"
	mediaadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/media/adapters"
	mediaservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/media/services"
	moduleadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/adapters"
	moduleservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/services"
	reviewadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/adapters"
	reviewservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/services"
	analyticsadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/adapters"
	analyticsservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/services"
	analyticscontrollers "github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/controllers"
	enrollmentadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/adapters"
	enrollmentservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/services"
	enrollmentcontrollers "github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/controllers"
	progressadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/adapters"
	progressservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/services"
	progresscontrollers "github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/controllers"
	certificateadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/adapters"
	certificateservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/services"
	certificatecontrollers "github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/controllers"
	useradapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/adapters"
	userservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/user/services"
	tenantadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/adapters"
	tenantservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/services"
	tenantcontrollers "github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/controllers"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/email"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jmoiron/sqlx"
)

const (
	// Token expiration durations
	verificationTokenExpiry   = 24 * time.Hour  // 24 hours for email verification
	passwordResetTokenExpiry  = 1 * time.Hour   // 1 hour for password reset
	bcryptCost               = 12               // Bcrypt cost factor
)

// Server representa el servidor Fiber con toda su configuración
type Server struct {
	app                    *fiber.App
	config                 *config.Config
	dbManager              *database.Manager
	controlDB              *sqlx.DB // Control DB for tenant management
	authController         *controllers.AuthController
	userController         *controllers.UserManagementController
	profileController      *controllers.ProfileController
	courseController       *controllers.CourseController
	categoryController     *controllers.CategoryController
	lessonController       *controllers.LessonController
	quizController         *controllers.QuizController
	assignmentController   *controllers.AssignmentController
	notificationController *controllers.NotificationController
	mediaController        *controllers.MediaController
	moduleController       *controllers.ModuleController
	reviewController       *controllers.ReviewController
	analyticsController    *analyticscontrollers.AnalyticsController
	enrollmentController   *enrollmentcontrollers.EnrollmentController
	progressController     *progresscontrollers.ProgressController
	certificateController  *certificatecontrollers.CertificateController
	tenantController       *tenantcontrollers.TenantController
	tokenService           tokens.TokenService
	authRepo               ports.AuthRepository
	// Tenant-aware controllers for dynamic DB connection
	tenantAwareCourseController       *controllers.TenantAwareCourseController
	tenantAwareCategoryController     *controllers.TenantAwareCategoryController
	tenantAwareNotificationController *controllers.TenantAwareNotificationController
	tenantAwareProgressController     *controllers.TenantAwareProgressController
	tenantAwareProfileController      *controllers.TenantAwareProfileController
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
		// Buffer sizes - Fix 431 error
		ReadBufferSize:  16384, // 16KB (default is 4096)
		WriteBufferSize: 16384, // 16KB
		BodyLimit:       10 * 1024 * 1024, // 10MB max body size
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

	// 2. Initialize email service for auth (needed for verification emails)
	log.Println("📧 Initializing email service for authentication...")
	authEmailService := email.NewEmailService(&cfg.Email, cfg.Server.BaseURL)
	authEmailAdapter := email.NewAuthEmailServiceAdapter(authEmailService)
	log.Println("✅ Email service for authentication initialized")

	// 3. Initialize repositories (using Control DB from dbManager)
	controlDB := dbManager.GetControlDB()
	authRepo := adapters.NewPostgreSQLAuthRepository(controlDB)
	authUserRepo := adapters.NewPostgreSQLUserRepository(controlDB) // For profile service
	userRepo := useradapters.NewPostgreSQLUserRepository(controlDB)

	// 4. Initialize services
	authService := services.NewAuthService(
		authRepo,
		passwordHasher,
		tokenService,
		authEmailAdapter,
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
	// Use relative URL so it works with proxies and different ports
	uploadsPath := "./uploads"
	uploadsURL := "/uploads"
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

	// Initialize dependency injection for modules module
	// NOTE: Modules must be initialized BEFORE lessons because lessons depend on modules
	log.Println("🔧 Initializing modules module...")

	// 1. Initialize module repository
	moduleRepo := moduleadapters.NewPostgreSQLModuleRepository(tenantDB)

	// 2. Initialize module service
	moduleService := moduleservices.NewModuleService(moduleRepo)

	// 3. Initialize module controller
	moduleController := controllers.NewModuleController(moduleService)

	log.Println("✅ Modules module initialized")

	// Initialize dependency injection for lessons module
	log.Println("🔧 Initializing lessons module...")

	// 1. Initialize lesson repository
	lessonRepo := lessonadapters.NewPostgreSQLLessonRepository(tenantDB)

	// 2. Initialize lesson service (now with module repository for validation)
	lessonService := lessonservices.NewLessonService(lessonRepo, moduleRepo)

	// Note: Lesson controller initialization moved after media module
	// to support video upload functionality

	log.Println("✅ Lessons service initialized")

	// Initialize dependency injection for quizzes module
	log.Println("🔧 Initializing quizzes module...")

	// 1. Initialize quiz repository
	quizRepo := quizadapters.NewPostgreSQLQuizRepository(tenantDB)

	// 2. Initialize quiz service
	quizService := quizservices.NewQuizService(quizRepo)

	// 3. Initialize quiz controller
	quizController := controllers.NewQuizController(quizService)

	log.Println("✅ Quizzes module initialized")

	// Initialize dependency injection for assignments module
	log.Println("🔧 Initializing assignments module...")

	// 1. Initialize assignment repository
	assignmentRepo := assignmentadapters.NewPostgreSQLAssignmentRepository(tenantDB)

	// 2. Initialize file storage for assignments
	assignmentFileStorage, err := assignmentadapters.NewLocalFileStorage(
		"./uploads/assignments",
		cfg.Server.BaseURL+"/uploads/assignments",
	)
	if err != nil {
		log.Fatalf("❌ Failed to initialize assignment file storage: %v", err)
	}

	// 3. Initialize assignment service
	assignmentService := assignmentservices.NewAssignmentService(assignmentRepo, assignmentFileStorage)

	// 4. Initialize assignment controller
	assignmentController := controllers.NewAssignmentController(assignmentService)

	log.Println("✅ Assignments module initialized")

	// Initialize dependency injection for notifications module
	log.Println("🔧 Initializing notifications module...")

	// 1. Initialize notification repository
	notificationRepo := notificationadapters.NewPostgreSQLNotificationRepository(tenantDB)

	// 2. Initialize email service
	log.Println("📧 Initializing email service...")
	emailService := email.NewEmailService(&cfg.Email, cfg.Server.BaseURL)
	emailServiceAdapter := email.NewEmailServiceAdapter(emailService)
	log.Println("✅ Email service initialized")

	// 3. Initialize notification service with email support
	notificationService := notificationservices.NewNotificationService(notificationRepo, emailServiceAdapter)

	// 4. Initialize notification controller
	notificationController := controllers.NewNotificationController(notificationService)

	log.Println("✅ Notifications module initialized")

	// Initialize dependency injection for media module
	log.Println("🔧 Initializing media module...")

	// 1. Initialize MinIO storage service
	storageService, err := mediaadapters.NewMinioStorageService(
		cfg.Storage.Endpoint,
		cfg.Storage.AWSAccessKey,
		cfg.Storage.AWSSecretKey,
		cfg.Storage.AWSRegion,
		cfg.Storage.BucketPrefix,
		cfg.Storage.UseSSL,
	)
	if err != nil {
		log.Printf("⚠️  Warning: Failed to initialize storage service: %v", err)
		// Continue without storage - will fail on upload attempts
	}

	// 2. Initialize media repository
	mediaRepo := mediaadapters.NewPostgreSQLMediaRepository(tenantDB)

	// 3. Initialize media service
	mediaService := mediaservices.NewMediaService(mediaRepo, storageService)

	// 4. Initialize media controller
	mediaController := controllers.NewMediaController(mediaService)

	log.Println("✅ Media module initialized")

	// Initialize lesson controller (moved here to have access to mediaService)
	log.Println("🔧 Initializing lesson controller with media support...")
	lessonController := controllers.NewLessonController(lessonService, mediaService)
	log.Println("✅ Lesson controller initialized")

	// NOTE: Modules module initialization has been moved up before lessons module
	// See lines 207-220 for the actual initialization

	// Initialize dependency injection for reviews module
	log.Println("🔧 Initializing reviews module...")

	// 1. Initialize review repository
	reviewRepo := reviewadapters.NewPostgreSQLReviewRepository(tenantDB)

	// 2. Initialize review service with course repository for rating sync
	// The course repository implements CourseRatingSync interface
	reviewService := reviewservices.NewReviewService(reviewRepo, courseRepo)

	// 3. Initialize review controller
	reviewController := controllers.NewReviewController(reviewService)

	log.Println("✅ Reviews module initialized")

	// Initialize dependency injection for analytics module
	log.Println("🔧 Initializing analytics module...")

	// 1. Initialize analytics repository
	analyticsRepo := analyticsadapters.NewPostgreSQLAnalyticsRepository(tenantDB.DB)

	// 2. Initialize analytics service
	analyticsService := analyticsservices.NewAnalyticsService(analyticsRepo)

	// 3. Initialize analytics controller
	analyticsController := analyticscontrollers.NewAnalyticsController(analyticsService)

	log.Println("✅ Analytics module initialized")

	// Initialize dependency injection for enrollments module
	log.Println("🔧 Initializing enrollments module...")

	// 1. Initialize enrollments repository
	enrollmentRepo := enrollmentadapters.NewPostgreSQLEnrollmentRepository(tenantDB.DB)

	// 2. Initialize enrollments service
	enrollmentService := enrollmentservices.NewEnrollmentService(enrollmentRepo)

	// 3. Initialize enrollments controller
	enrollmentController := enrollmentcontrollers.NewEnrollmentController(enrollmentService)

	log.Println("✅ Enrollments module initialized")

	// Initialize dependency injection for progress module
	log.Println("🔧 Initializing progress module...")

	// 1. Initialize progress repository
	progressRepo := progressadapters.NewPostgreSQLProgressRepository(tenantDB.DB)

	// 2. Initialize progress service
	progressService := progressservices.NewProgressService(progressRepo)

	// 3. Initialize progress controller
	progressController := progresscontrollers.NewProgressController(progressService)

	log.Println("✅ Progress module initialized")

	// Initialize dependency injection for certificates module
	log.Println("🔧 Initializing certificates module...")

	// 1. Initialize certificates repository
	certificateRepo := certificateadapters.NewPostgreSQLCertificateRepository(tenantDB.DB)

	// 2. Initialize certificate generator (PDF generation with gofpdf)
	certificateGenerator := certificateadapters.NewPDFGenerator()

	// 3. Initialize certificate storage (local file system)
	certificateStorage, err := certificateadapters.NewLocalCertificateStorage("./certificates", cfg.Server.BaseURL+"/certificates")
	if err != nil {
		log.Fatalf("❌ Failed to initialize certificate storage: %v", err)
	}

	// 4. Initialize certificates service
	certificateService := certificateservices.NewCertificateService(certificateRepo, certificateGenerator, certificateStorage, cfg.Server.BaseURL)

	// 5. Initialize certificates controller
	certificateController := certificatecontrollers.NewCertificateController(certificateService)

	log.Println("✅ Certificates module initialized")

	// Initialize dependency injection for tenants module
	log.Println("🔧 Initializing tenants module...")

	// 1. Initialize migration runner
	migrationRunner := database.NewMigrationRunner(dbManager)

	// 2. Initialize tenant repository
	tenantRepo := tenantadapters.NewPostgresTenantRepository(controlDB, dbManager)

	// 3. Initialize tenant service (with userManagementService dependency)
	tenantService := tenantservices.NewTenantService(tenantRepo, dbManager, migrationRunner, tokenService, userManagementService)

	// 4. Initialize tenant controller
	tenantController := tenantcontrollers.NewTenantController(tenantService)

	log.Println("✅ Tenants module initialized")

	// Initialize tenant-aware controllers for dynamic DB connection
	log.Println("🔧 Initializing tenant-aware controllers...")

	tenantAwareCourseController := controllers.NewTenantAwareCourseController()
	tenantAwareCategoryController := controllers.NewTenantAwareCategoryController()
	tenantAwareNotificationController := controllers.NewTenantAwareNotificationController(emailServiceAdapter)
	tenantAwareProgressController := controllers.NewTenantAwareProgressController()
	tenantAwareProfileController := controllers.NewTenantAwareProfileController(
		authRepo,
		authUserRepo,
		fileStorage,
		passwordHasher,
	)

	log.Println("✅ Tenant-aware controllers initialized")

	// Crear instancia del servidor
	server := &Server{
		app:                    app,
		config:                 cfg,
		dbManager:              dbManager,
		controlDB:              controlDB,
		authController:         authController,
		userController:         userController,
		profileController:      profileController,
		courseController:       courseController,
		categoryController:     categoryController,
		lessonController:       lessonController,
		quizController:         quizController,
		assignmentController:   assignmentController,
		notificationController: notificationController,
		mediaController:        mediaController,
		moduleController:       moduleController,
		reviewController:       reviewController,
		analyticsController:    analyticsController,
		enrollmentController:   enrollmentController,
		progressController:     progressController,
		certificateController:  certificateController,
		tenantController:       tenantController,
		tokenService:           tokenService,
		authRepo:               authRepo,
		// Tenant-aware controllers
		tenantAwareCourseController:       tenantAwareCourseController,
		tenantAwareCategoryController:     tenantAwareCategoryController,
		tenantAwareNotificationController: tenantAwareNotificationController,
		tenantAwareProgressController:     tenantAwareProgressController,
		tenantAwareProfileController:      tenantAwareProfileController,
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
		AllowHeaders:     "*", // Allow all headers to fix 431 error
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

	// Apply OPTIONAL tenant middleware to all API routes
	// This will try to extract tenant_id but won't fail if missing
	// Individual route groups can require tenant if needed
	api.Use(middleware.OptionalTenantMiddleware(s.dbManager))

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
	// Profile Routes (Protected - Authentication required + Tenant-aware)
	// ============================================================
	profile := v1.Group("/profile")
	profile.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	profile.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		profile.Get("/me", s.tenantAwareProfileController.GetMyProfile)
		profile.Put("/me", s.tenantAwareProfileController.UpdateMyProfile)
		profile.Post("/change-password", s.tenantAwareProfileController.ChangePassword)
		profile.Post("/avatar", s.tenantAwareProfileController.UploadAvatar)
		profile.Delete("/avatar", s.tenantAwareProfileController.DeleteAvatar)
		profile.Put("/preferences", s.tenantAwareProfileController.UpdatePreferences)
	}

	// ============================================================
	// Tenant Routes (Protected - Authentication required)
	// ============================================================
	tenants := v1.Group("/tenants")
	tenants.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	{
		// Get user's tenants and invitations
		tenants.Get("/", s.tenantController.GetUserTenants)
		tenants.Get("/invitations", s.tenantController.GetPendingInvitations)

		// Create new tenant (user becomes admin)
		tenants.Post("/", s.tenantController.CreateTenant)

		// Select tenant (switches context)
		tenants.Post("/select", s.tenantController.SelectTenant)

		// Invitation management
		tenants.Post("/invitations/accept", s.tenantController.AcceptInvitation)
		tenants.Post("/invitations/reject", s.tenantController.RejectInvitation)

		// Admin-only routes (require tenant context and admin role)
		// These routes need OptionalTenantMiddleware to extract tenant_id from JWT or header
		adminTenantRoutes := tenants.Group("")
		adminTenantRoutes.Use(middleware.OptionalTenantMiddleware(s.dbManager))
		adminTenantRoutes.Post("/invite", s.tenantController.InviteUser)
		adminTenantRoutes.Post("/users", s.tenantController.CreateUserInTenant)
		adminTenantRoutes.Get("/members", s.tenantController.GetTenantMembers)
	}

	// ============================================================
	// Course Routes
	// ============================================================
	courses := v1.Group("/courses")

	// All course routes require auth and tenant context for proper tenant isolation
	// This ensures courses are properly isolated per tenant
	courses.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	courses.Use(middleware.TenantMiddleware(s.dbManager))
	courses.Use(middleware.MembershipMiddleware(s.controlDB))

	// Read-only course routes (all authenticated users with tenant membership)
	{
		courses.Get("/published", s.tenantAwareCourseController.GetPublishedCourses)
		courses.Get("/slug/:slug", s.tenantAwareCourseController.GetCourseBySlug)
		courses.Get("/instructor/:instructorId", s.tenantAwareCourseController.GetCoursesByInstructor)
		courses.Get("/category/:categoryId", s.tenantAwareCourseController.GetCoursesByCategory)
		courses.Get("/:id", s.tenantAwareCourseController.GetCourse)
		courses.Get("/", s.tenantAwareCourseController.ListCourses)
	}

	// Course action routes (authentication + tenant membership required)
	// Using TenantAwareCourseController for dynamic tenant DB connection
	coursesProtected := courses.Group("")
	{
		// Student actions - using tenant-aware controller
		coursesProtected.Post("/:id/enroll", s.tenantAwareCourseController.EnrollCourse)
		coursesProtected.Post("/:id/unenroll", s.tenantAwareCourseController.UnenrollCourse)
		coursesProtected.Post("/:id/rate", s.tenantAwareCourseController.RateCourse)

		// Instructor/Admin actions - using tenant-aware controller
		coursesProtected.Post("/", s.tenantAwareCourseController.CreateCourse)
		coursesProtected.Put("/:id", s.tenantAwareCourseController.UpdateCourse)
		coursesProtected.Delete("/:id", s.tenantAwareCourseController.DeleteCourse)
		coursesProtected.Post("/:id/publish", s.tenantAwareCourseController.PublishCourse)
		coursesProtected.Post("/:id/unpublish", s.tenantAwareCourseController.UnpublishCourse)
		coursesProtected.Post("/:id/archive", s.tenantAwareCourseController.ArchiveCourse)
	}

	// ============================================================
	// Category Routes
	// ============================================================
	categories := v1.Group("/categories")

	// All category routes require auth and tenant context for proper tenant isolation
	categories.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	categories.Use(middleware.TenantMiddleware(s.dbManager))
	categories.Use(middleware.MembershipMiddleware(s.controlDB))

	// Read-only category routes (all authenticated users with tenant membership)
	{
		categories.Get("/active", s.tenantAwareCategoryController.ListActiveCategories)
		categories.Get("/slug/:slug", s.tenantAwareCategoryController.GetCategoryBySlug)
		categories.Get("/:id/subcategories", s.tenantAwareCategoryController.GetSubcategories)
		categories.Get("/:id", s.tenantAwareCategoryController.GetCategory)
		categories.Get("/", s.tenantAwareCategoryController.ListCategories)
	}

	// Admin-only category routes
	categoriesProtected := categories.Group("")
	categoriesProtected.Use(middleware.RequireAdmin())
	{
		categoriesProtected.Post("/", s.tenantAwareCategoryController.CreateCategory)
		categoriesProtected.Put("/:id", s.tenantAwareCategoryController.UpdateCategory)
		categoriesProtected.Delete("/:id", s.tenantAwareCategoryController.DeleteCategory)
		categoriesProtected.Post("/:id/activate", s.tenantAwareCategoryController.ActivateCategory)
		categoriesProtected.Post("/:id/deactivate", s.tenantAwareCategoryController.DeactivateCategory)
	}

	// ============================================================
	// Lesson Routes
	// ============================================================
	lessons := v1.Group("/lessons")

	// Public lesson routes (read-only, no auth required for free lessons)
	{
		lessons.Get("/:id", s.lessonController.GetLesson)
	}

	// Protected lesson routes (authentication + tenant membership required)
	lessonsProtected := lessons.Group("")
	lessonsProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	lessonsProtected.Use(middleware.TenantMiddleware(s.dbManager))
	lessonsProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Student actions
		lessonsProtected.Post("/:id/complete", s.lessonController.MarkLessonComplete)
		lessonsProtected.Get("/:id/completion", s.lessonController.GetLessonCompletion)

		// Instructor/Admin actions (TODO: Add instructor/admin middleware)
		lessonsProtected.Put("/:id", s.lessonController.UpdateLesson)
		lessonsProtected.Delete("/:id", s.lessonController.DeleteLesson)
		lessonsProtected.Post("/:id/video", s.lessonController.UploadLessonVideo)
	}

	// Course-specific lesson routes (nested under courses)
	// Public: Get lessons for a course
	courses.Get("/:courseId/lessons", s.lessonController.GetLessonsByCourse)

	// Protected: Course lesson routes
	coursesProtected.Get("/:courseId/lessons/progress", s.lessonController.GetLessonsWithProgress)
	coursesProtected.Get("/:courseId/progress", s.lessonController.GetCourseProgress)
	coursesProtected.Post("/:courseId/lessons", s.lessonController.CreateLesson)
	coursesProtected.Post("/:courseId/lessons/reorder", s.lessonController.ReorderLessons)

	// ============================================================
	// Quiz Routes
	// ============================================================
	quizzes := v1.Group("/quizzes")

	// Public quiz routes (read-only, no authentication required)
	{
		quizzes.Get("/:id", s.quizController.GetQuiz)
	}

	// Protected quiz routes (authentication + tenant membership required)
	quizzesProtected := quizzes.Group("")
	quizzesProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	quizzesProtected.Use(middleware.TenantMiddleware(s.dbManager))
	quizzesProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Student actions
		quizzesProtected.Post("/:quizId/attempts", s.quizController.StartQuizAttempt)
		quizzesProtected.Post("/attempts/:attemptId/submit", s.quizController.SubmitQuizAttempt)
		quizzesProtected.Get("/attempts/:attemptId", s.quizController.GetAttemptDetails)
		quizzesProtected.Get("/:quizId/my-attempts", s.quizController.GetMyAttempts)

		// Instructor/Admin actions (TODO: Add instructor/admin middleware)
		quizzesProtected.Put("/:id", s.quizController.UpdateQuiz)
		quizzesProtected.Delete("/:id", s.quizController.DeleteQuiz)
		quizzesProtected.Post("/:quizId/questions", s.quizController.CreateQuestion)
		quizzesProtected.Put("/questions/:id", s.quizController.UpdateQuestion)
		quizzesProtected.Delete("/questions/:id", s.quizController.DeleteQuestion)
		quizzesProtected.Post("/:quizId/questions/reorder", s.quizController.ReorderQuestions)
		quizzesProtected.Post("/answers/:answerId/grade", s.quizController.GradeEssayQuestion)
		quizzesProtected.Get("/:quizId/statistics", s.quizController.GetQuizStatistics)
		quizzesProtected.Get("/:quizId/attempts", s.quizController.GetQuizAttempts)
	}

	// Course-specific quiz routes (nested under courses)
	// Public: Get quizzes for a course
	courses.Get("/:courseId/quizzes", s.quizController.GetQuizzesByCourse)

	// Protected: Course quiz routes
	coursesProtected.Post("/:courseId/quizzes", s.quizController.CreateQuiz)

	// Lesson-specific quiz routes (nested under lessons)
	// Public: Get quiz for a lesson
	lessons.Get("/:lessonId/quiz", s.quizController.GetQuizByLesson)

	// ============================================================
	// Assignment Routes
	// ============================================================
	assignments := v1.Group("/assignments")

	// Public assignment routes (read-only, no auth required)
	{
		assignments.Get("/:id", s.assignmentController.GetAssignment)
	}

	// Protected assignment routes (authentication + tenant membership required)
	assignmentsProtected := assignments.Group("")
	assignmentsProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	assignmentsProtected.Use(middleware.TenantMiddleware(s.dbManager))
	assignmentsProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Student actions - View assignments
		assignmentsProtected.Get("/my", s.assignmentController.GetMyAssignments)

		// Student actions - Submissions
		assignmentsProtected.Get("/:assignmentId/my-submission", s.assignmentController.GetMySubmission)
		assignmentsProtected.Get("/my-submissions", s.assignmentController.GetMySubmissions)
		assignmentsProtected.Post("/:assignmentId/submissions", s.assignmentController.CreateSubmission)
		assignmentsProtected.Put("/submissions/:submissionId", s.assignmentController.UpdateSubmission)
		assignmentsProtected.Post("/submissions/:submissionId/submit", s.assignmentController.SubmitAssignment)

		// Student actions - File uploads for submissions
		assignmentsProtected.Post("/submissions/:submissionId/files", s.assignmentController.UploadSubmissionFile)
		assignmentsProtected.Delete("/submissions/:submissionId/files/:fileId", s.assignmentController.DeleteSubmissionFile)

		// Student actions - Comments
		assignmentsProtected.Post("/submissions/:submissionId/comments", s.assignmentController.AddComment)
		assignmentsProtected.Get("/submissions/:submissionId/comments", s.assignmentController.GetSubmissionComments)
		assignmentsProtected.Put("/comments/:commentId", s.assignmentController.UpdateComment)
		assignmentsProtected.Delete("/comments/:commentId", s.assignmentController.DeleteComment)

		// Student actions - Peer reviews
		assignmentsProtected.Get("/peer-reviews/my", s.assignmentController.GetMyPeerReviews)
		assignmentsProtected.Post("/peer-reviews/:reviewId/submit", s.assignmentController.SubmitPeerReview)
		assignmentsProtected.Get("/submissions/:submissionId/peer-reviews", s.assignmentController.GetSubmissionPeerReviews)

		// Instructor/Admin actions - Assignment CRUD
		assignmentsProtected.Post("/", s.assignmentController.CreateAssignment)
		assignmentsProtected.Put("/:id", s.assignmentController.UpdateAssignment)
		assignmentsProtected.Delete("/:id", s.assignmentController.DeleteAssignment)
		assignmentsProtected.Post("/:id/publish", s.assignmentController.PublishAssignment)
		assignmentsProtected.Post("/:id/unpublish", s.assignmentController.UnpublishAssignment)

		// Instructor/Admin actions - File uploads for assignments
		assignmentsProtected.Post("/:assignmentId/files", s.assignmentController.UploadAssignmentFile)
		assignmentsProtected.Delete("/:assignmentId/files/:fileId", s.assignmentController.DeleteAssignmentFile)

		// Instructor/Admin actions - Grading
		assignmentsProtected.Get("/submissions/:submissionId", s.assignmentController.GetSubmission)
		assignmentsProtected.Get("/:assignmentId/submissions", s.assignmentController.GetAssignmentSubmissions)
		assignmentsProtected.Get("/students/:studentId/submissions", s.assignmentController.GetStudentSubmissions)
		assignmentsProtected.Post("/submissions/:submissionId/grade", s.assignmentController.GradeSubmission)
		assignmentsProtected.Post("/bulk-grade", s.assignmentController.BulkGrade)
		assignmentsProtected.Post("/submissions/:submissionId/return", s.assignmentController.ReturnSubmission)
		assignmentsProtected.Delete("/submissions/:submissionId", s.assignmentController.DeleteSubmission)

		// Instructor/Admin actions - Peer review management
		assignmentsProtected.Post("/peer-reviews", s.assignmentController.AssignPeerReview)
		assignmentsProtected.Delete("/peer-reviews/:reviewId", s.assignmentController.DeletePeerReview)

		// Instructor/Admin actions - Statistics
		assignmentsProtected.Get("/:assignmentId/statistics", s.assignmentController.GetAssignmentStatistics)
		assignmentsProtected.Get("/students/:studentId/progress", s.assignmentController.GetStudentProgress)
		assignmentsProtected.Get("/courses/:courseId/statistics", s.assignmentController.GetCourseStatistics)

		// File operations
		assignmentsProtected.Get("/files/:fileId", s.assignmentController.GetFile)
		assignmentsProtected.Get("/files/:fileId/download", s.assignmentController.DownloadFile)
	}

	// ============================================================
	// Rubric Routes (separate from assignments for reusability)
	// ============================================================
	rubrics := v1.Group("/rubrics")

	// Protected rubric routes (authentication + tenant membership required)
	rubricsProtected := rubrics.Group("")
	rubricsProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	rubricsProtected.Use(middleware.TenantMiddleware(s.dbManager))
	rubricsProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Instructor/Admin actions - Rubric management
		rubricsProtected.Post("/", s.assignmentController.CreateRubric)
		rubricsProtected.Get("/:id", s.assignmentController.GetRubric)
		rubricsProtected.Get("/", s.assignmentController.GetTenantRubrics)
		rubricsProtected.Get("/templates", s.assignmentController.GetRubricTemplates)
		rubricsProtected.Put("/:id", s.assignmentController.UpdateRubric)
		rubricsProtected.Delete("/:id", s.assignmentController.DeleteRubric)

		// Attach/detach rubrics to assignments
		rubricsProtected.Post("/:rubricId/attach/:assignmentId", s.assignmentController.AttachRubricToAssignment)
		rubricsProtected.Delete("/:rubricId/detach/:assignmentId", s.assignmentController.DetachRubricFromAssignment)
	}

	// Course-specific assignment routes (nested under courses)
	// Public: Get assignments for a course
	courses.Get("/:courseId/assignments", s.assignmentController.GetCourseAssignments)

	// Protected: Course assignment routes
	coursesProtected.Post("/:courseId/assignments", s.assignmentController.CreateAssignment)

	// ============================================================
	// Notification Routes
	// ============================================================
	notifications := v1.Group("/notifications")

	// All notification routes are protected (authentication + tenant membership required)
	// Using TenantAwareNotificationController for dynamic tenant DB connection
	notificationsProtected := notifications.Group("")
	notificationsProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	notificationsProtected.Use(middleware.TenantMiddleware(s.dbManager))
	notificationsProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Basic CRUD operations for notifications - using tenant-aware controller
		notificationsProtected.Post("/", s.tenantAwareNotificationController.CreateNotification)
		notificationsProtected.Get("/:id", s.tenantAwareNotificationController.GetNotification)
		notificationsProtected.Get("/", s.tenantAwareNotificationController.GetUserNotifications)
		notificationsProtected.Patch("/:id/status", s.tenantAwareNotificationController.UpdateNotificationStatus)
		notificationsProtected.Delete("/:id", s.tenantAwareNotificationController.DeleteNotification)

		// Convenience methods for status updates
		notificationsProtected.Post("/:id/read", s.tenantAwareNotificationController.MarkAsRead)
		notificationsProtected.Post("/:id/unread", s.tenantAwareNotificationController.MarkAsUnread)
		notificationsProtected.Post("/:id/archive", s.tenantAwareNotificationController.ArchiveNotification)

		// Bulk operations
		notificationsProtected.Post("/bulk", s.tenantAwareNotificationController.CreateBulkNotifications)
		notificationsProtected.Post("/mark-all-read", s.tenantAwareNotificationController.MarkAllAsRead)
		notificationsProtected.Delete("/read", s.tenantAwareNotificationController.DeleteAllRead)

		// Queries
		notificationsProtected.Get("/unread/count", s.tenantAwareNotificationController.GetUnreadCount)

		// Specific notification type endpoints
		notificationsProtected.Post("/course-completion", s.tenantAwareNotificationController.SendCourseCompletionNotification)
		notificationsProtected.Post("/progress", s.tenantAwareNotificationController.SendProgressNotification)
		notificationsProtected.Post("/enrollment", s.tenantAwareNotificationController.SendEnrollmentNotification)
		notificationsProtected.Post("/quiz-completion", s.tenantAwareNotificationController.SendQuizCompletionNotification)
		notificationsProtected.Post("/announcement", s.tenantAwareNotificationController.SendAnnouncement)

		// Notification preferences
		notificationsProtected.Get("/preferences", s.tenantAwareNotificationController.GetUserPreferences)
		notificationsProtected.Put("/preferences", s.tenantAwareNotificationController.UpdateUserPreferences)

		// Push subscriptions
		notificationsProtected.Post("/push-subscriptions", s.tenantAwareNotificationController.CreatePushSubscription)
		notificationsProtected.Get("/push-subscriptions", s.tenantAwareNotificationController.GetUserPushSubscriptions)
		notificationsProtected.Delete("/push-subscriptions/:id", s.tenantAwareNotificationController.DeletePushSubscription)
	}

	// ============================================================
	// Media Routes
	// ============================================================
	media := v1.Group("/media")

	// All media routes are protected (authentication + tenant membership required)
	mediaProtected := media.Group("")
	mediaProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	mediaProtected.Use(middleware.TenantMiddleware(s.dbManager))
	mediaProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Upload operations
		mediaProtected.Post("/upload", s.mediaController.UploadMedia)
		mediaProtected.Post("/upload/multiple", s.mediaController.UploadMultiple)

		// CRUD operations
		mediaProtected.Get("/:id", s.mediaController.GetMedia)
		mediaProtected.Get("/my", s.mediaController.GetMyMedia)
		mediaProtected.Get("/user/:userId", s.mediaController.GetUserMedia)
		mediaProtected.Get("/", s.mediaController.ListMedia)
		mediaProtected.Patch("/:id", s.mediaController.UpdateMedia)
		mediaProtected.Delete("/:id", s.mediaController.DeleteMedia)

		// Download operations
		mediaProtected.Get("/:id/download-url", s.mediaController.GetDownloadURL)
		mediaProtected.Get("/:id/download", s.mediaController.DownloadMedia)

		// Query operations
		mediaProtected.Get("/search", s.mediaController.SearchMedia)
		mediaProtected.Get("/context/:context/:contextId", s.mediaController.GetMediaByContext)

		// Statistics
		mediaProtected.Get("/stats", s.mediaController.GetStorageStats)
	}

	// ============================================================
	// Module Routes
	// ============================================================
	modules := v1.Group("/modules")

	// Public module routes (read-only for published modules)
	{
		modules.Get("/:id", s.moduleController.GetModule)
		modules.Get("/:id/lessons", s.moduleController.GetModuleWithLessons)
	}

	// Protected module routes (authentication + tenant membership required)
	modulesProtected := modules.Group("")
	modulesProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	modulesProtected.Use(middleware.TenantMiddleware(s.dbManager))
	modulesProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Student actions - Progress tracking
		modulesProtected.Get("/:id/progress", s.moduleController.GetModuleProgress)
		modulesProtected.Post("/:id/progress", s.moduleController.UpdateModuleProgress)

		// Instructor/Admin actions - Module CRUD
		modulesProtected.Post("/", s.moduleController.CreateModule)
		modulesProtected.Patch("/:id", s.moduleController.UpdateModule)
		modulesProtected.Delete("/:id", s.moduleController.DeleteModule)

		// Instructor/Admin actions - Publishing
		modulesProtected.Post("/:id/publish", s.moduleController.PublishModule)
		modulesProtected.Post("/:id/unpublish", s.moduleController.UnpublishModule)
	}

	// Course-specific module routes (nested under courses)
	// Public: Get modules for a course
	courses.Get("/:courseId/modules", s.moduleController.GetCourseModules)

	// Protected: Course module routes
	coursesProtected.Get("/:courseId/modules/progress", s.moduleController.GetCourseModulesWithProgress)
	coursesProtected.Post("/:courseId/modules", s.moduleController.CreateModule)
	coursesProtected.Post("/:courseId/modules/reorder", s.moduleController.ReorderModules)

	// ============================================================
	// Review Routes
	// ============================================================
	reviews := v1.Group("/reviews")

	// Public review routes (read-only for public reviews)
	{
		reviews.Get("/:id", s.reviewController.GetReview)
	}

	// Protected review routes (authentication + tenant membership required)
	reviewsProtected := reviews.Group("")
	reviewsProtected.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	reviewsProtected.Use(middleware.TenantMiddleware(s.dbManager))
	reviewsProtected.Use(middleware.MembershipMiddleware(s.controlDB))
	{
		// Student actions - Review CRUD
		reviewsProtected.Post("/", s.reviewController.CreateReview)
		reviewsProtected.Patch("/:id", s.reviewController.UpdateReview)
		reviewsProtected.Delete("/:id", s.reviewController.DeleteReview)
		reviewsProtected.Get("/my", s.reviewController.GetMyReviews)

		// Student actions - Helpful voting
		reviewsProtected.Post("/:id/vote", s.reviewController.VoteReview)
		reviewsProtected.Delete("/:id/vote", s.reviewController.RemoveVote)

		// Student actions - Report reviews
		reviewsProtected.Post("/:id/report", s.reviewController.ReportReview)
		reviewsProtected.Get("/:id/reports", s.reviewController.GetReviewReports)

		// Admin actions - Moderation
		reviewsProtected.Get("/reports/pending", s.reviewController.GetPendingReports)
		reviewsProtected.Patch("/reports/:reportId/status", s.reviewController.UpdateReportStatus)
		reviewsProtected.Delete("/:id/admin", s.reviewController.DeleteReviewByAdmin)
	}

	// Course-specific review routes (nested under courses)
	// Public: Get reviews and rating for a course
	courses.Get("/:courseId/reviews", s.reviewController.GetCourseReviews)
	courses.Get("/:courseId/rating", s.reviewController.GetCourseRating)

	// Protected: Get user's review for a course
	coursesProtected.Get("/:courseId/my-review", s.reviewController.GetUserReviewForCourse)

	// ============================================================
	// Analytics Routes (Protected - Authentication required)
	// ============================================================
	// Note: All analytics routes are protected by authentication
	// Permission checks happen at the service layer (students can only see their own, instructors see their courses, admins see all)
	analytics := v1.Group("/analytics")
	analytics.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	analytics.Use(middleware.TenantMiddleware(s.dbManager))
	analytics.Use(middleware.MembershipMiddleware(s.controlDB))
	s.analyticsController.RegisterRoutes(analytics)

	// ============================================================
	// Enrollment Routes (Protected - Authentication required)
	// ============================================================
	// Note: All enrollment routes are protected by authentication
	// Students can enroll themselves and view their own enrollments
	// Instructors/Admins can manage all enrollments for their courses
	s.enrollmentController.RegisterRoutes(v1)

	// ============================================================
	// Progress Routes (Protected - Authentication required)
	// ============================================================
	// Note: All progress routes are protected by authentication
	// Students can view and update their own progress
	// Instructors/Admins can view and manage progress for all students
	// Using TenantAwareProgressController for dynamic tenant DB connection
	progress := v1.Group("/progress")
	progress.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	progress.Use(middleware.TenantMiddleware(s.dbManager))
	progress.Use(middleware.MembershipMiddleware(s.controlDB))
	s.tenantAwareProgressController.RegisterRoutes(progress)

	// ============================================================
	// Certificate Routes (Protected - Authentication required)
	// ============================================================
	// Note: All certificate routes are protected by authentication
	// Students can view and download their own certificates
	// Instructors/Admins can generate, manage, and revoke certificates
	// Certificate verification endpoint is available for public use
	s.certificateController.RegisterRoutes(v1)

	// ============================================================
	// Admin Routes (Protected - Authentication + RBAC required)
	// ============================================================
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	admin.Use(middleware.TenantMiddleware(s.dbManager)) // Require tenant context for admin routes
	admin.Use(middleware.MembershipMiddleware(s.controlDB)) // Verify membership in tenant
	admin.Use(middleware.RequireAdmin()) // Requires admin or higher (superadmin)

	// User Management
	users := admin.Group("/users")
	{
		// CRUD Operations
		users.Post("/", s.userController.CreateUser)
		// Use tenant-aware user list that shows membership roles instead of global roles
		users.Get("/", s.tenantController.GetTenantMembersWithUsers)
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

	// Profile Management (Admin only - Tenant-aware)
	profiles := admin.Group("/profiles")
	{
		profiles.Get("/:id", s.tenantAwareProfileController.GetProfile)
		profiles.Put("/:id", s.tenantAwareProfileController.UpdateProfile)
	}

	// Dashboard (Admin only)
	admin.Get("/dashboard", s.adminDashboardHandler)

	// Course Management (Admin only) - using tenant-aware controller
	adminCourses := admin.Group("/courses")
	{
		adminCourses.Get("/", s.tenantAwareCourseController.ListCourses)
		adminCourses.Get("/:id", s.tenantAwareCourseController.GetCourse)
		adminCourses.Post("/", s.tenantAwareCourseController.CreateCourse)
		adminCourses.Put("/:id", s.tenantAwareCourseController.UpdateCourse)
		adminCourses.Delete("/:id", s.tenantAwareCourseController.DeleteCourse)
		adminCourses.Post("/:id/publish", s.tenantAwareCourseController.PublishCourse)
		adminCourses.Post("/:id/unpublish", s.tenantAwareCourseController.UnpublishCourse)
	}

	// ============================================================
	// SuperAdmin Routes (Protected - SuperAdmin only)
	// ============================================================
	superadmin := v1.Group("/superadmin")
	superadmin.Use(middleware.AuthMiddleware(s.tokenService, s.authRepo))
	superadmin.Use(middleware.RequireSuperAdmin()) // Requires superadmin role only

	// Tenant Management (SuperAdmin only - critical operations)
	superadminTenants := superadmin.Group("/tenants")
	{
		superadminTenants.Get("/:tenantId/users", s.userController.GetUsersByTenant)
		superadminTenants.Get("/:tenantId/users/count", s.userController.CountUsersByTenant)
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

// adminDashboardHandler returns basic dashboard statistics for admin
func (s *Server) adminDashboardHandler(c *fiber.Ctx) error {
	// Return basic dashboard data
	// In a real implementation, this would query real statistics
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Dashboard data retrieved successfully",
		"data": fiber.Map{
			"totalUsers":       0,
			"totalCourses":     0,
			"totalEnrollments": 0,
			"activeUsers":      0,
			"recentActivity":   []interface{}{},
		},
	})
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
