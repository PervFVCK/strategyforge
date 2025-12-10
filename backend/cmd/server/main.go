package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"

	"github.com/PervFVCK/strategyforge/internal/handlers"
	"github.com/PervFVCK/strategyforge/internal/middleware"
	"github.com/PervFVCK/strategyforge/pkg/database"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using system environment variables")
	}

	// Initialize database
	log.Println("🔌 Connecting to database...")
	if err := database.InitDatabase(); err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Run migrations
	if err := database.RunMigrations(); err != nil {
		log.Fatalf("❌ Failed to run migrations: %v", err)
	}

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		AppName:               "StrategyForge Africa v1.0",
		ServerHeader:          "StrategyForge",
		StrictRouting:         true,
		CaseSensitive:         true,
		ErrorHandler:          customErrorHandler,
		DisableStartupMessage: false,
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		IdleTimeout:           120 * time.Second,
	})

	// Security Middleware - Using only fields that exist in helmet
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "1; mode=block",
		ContentTypeNosniff:        "nosniff",
		XFrameOptions:             "DENY",
		HSTSMaxAge:                31536000,
		HSTSExcludeSubdomains:     false,
		ContentSecurityPolicy:     "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
		ReferrerPolicy:            "no-referrer",
		CrossOriginEmbedderPolicy: "require-corp",
		CrossOriginOpenerPolicy:   "same-origin",
		CrossOriginResourcePolicy: "same-origin",
	}))

	// CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getEnv("FRONTEND_URL", "http://localhost:5173"),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// Rate Limiting
	app.Use(limiter.New(limiter.Config{
		Max:               100,
		Expiration:        15 * time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error":   "Rate limit exceeded",
				"message": "Too many requests. Please try again in 15 minutes.",
			})
		},
	}))

	// Request logging
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Africa/Lagos",
	}))

	// Recover from panics
	app.Use(recover.New())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		// Check database
		if err := database.HealthCheck(); err != nil {
			return c.Status(503).JSON(fiber.Map{
				"status":  "unhealthy",
				"message": "Database connection failed",
			})
		}

		return c.JSON(fiber.Map{
			"status":   "healthy",
			"version":  "1.0.0",
			"service":  "StrategyForge Africa API",
			"database": "connected",
			"time":     time.Now().Format(time.RFC3339),
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Public auth routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.HandleRegister)
	auth.Post("/login", handlers.HandleLogin)
	auth.Post("/magic-link", handlers.HandleSendMagicLink)
	auth.Post("/verify-magic-link", handlers.HandleVerifyMagicLink)
	auth.Post("/refresh", handlers.HandleRefreshToken)
	auth.Post("/google-oauth", handlers.HandleGoogleOAuth)

	// Protected routes (require JWT)
	protected := api.Group("/", middleware.JWTMiddleware)
	protected.Get("/me", handlers.HandleGetCurrentUser)
	protected.Post("/logout", handlers.HandleLogout)

	// Future protected routes
	protected.Post("/upload", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Upload endpoint - Coming in Phase 2"})
	})
	protected.Post("/backtest", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Backtest endpoint - Coming in Phase 3"})
	})
	protected.Get("/strategies", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Strategies endpoint - Coming in Phase 6"})
	})

	// Pro-only routes
	pro := protected.Group("/", middleware.RequireProMiddleware)
	pro.Get("/pro-feature", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Pro-only feature"})
	})

	// 404 handler
	app.Use(func(c *fiber.Ctx) error {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Not Found",
			"message": "The requested endpoint does not exist",
			"path":    c.Path(),
		})
	})

	// Start server
	port := getEnv("PORT", "8080")
	log.Println("========================================")
	log.Println("🚀 StrategyForge Africa API")
	log.Println("========================================")
	log.Printf("📍 Server:        http://localhost:%s\n", port)
	log.Printf("🏥 Health check:  http://localhost:%s/health\n", port)
	log.Printf("🔐 API endpoint:  http://localhost:%s/api/v1\n", port)
	log.Println("========================================")
	log.Println("💰 Built in Nigeria. For Africa. For the World.")
	log.Println("========================================")

	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}

func customErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	return c.Status(code).JSON(fiber.Map{
		"error":   true,
		"message": message,
		"code":    code,
	})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
