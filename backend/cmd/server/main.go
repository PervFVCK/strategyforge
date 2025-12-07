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
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Fiber app with config
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

	// Security Middleware
        // Security Middleware
        app.Use(helmet.New(helmet.Config{
                XSSProtection:      "1; mode=block",
                ContentTypeNosniff: "nosniff",
                XFrameOptions:      "DENY",
        }))

	// CORS - Restrict to frontend domain
	app.Use(cors.New(cors.Config{
		AllowOrigins:     getEnv("FRONTEND_URL", "http://localhost:5173"),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// Rate Limiting - 100 requests per 15 minutes per IP
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

	// Health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"version": "1.0.0",
			"service": "StrategyForge Africa API",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/register", handleRegister)
	auth.Post("/login", handleLogin)
	auth.Post("/verify-magic-link", handleVerifyMagicLink)
	auth.Post("/google-oauth", handleGoogleOAuth)
	auth.Post("/refresh", handleRefreshToken)

	// Protected routes (require JWT)
	protected := api.Group("/", jwtMiddleware)
	protected.Get("/me", handleGetCurrentUser)
	protected.Post("/upload", handleFileUpload)
	protected.Post("/backtest", handleBacktest)
	protected.Get("/strategies", handleGetStrategies)

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
	log.Printf("🚀 StrategyForge API starting on port %s...\n", port)
	log.Printf("📍 Health check: http://localhost:%s/health\n", port)
	log.Printf("🔐 API endpoint: http://localhost:%s/api/v1\n", port)
	log.Fatal(app.Listen(":" + port))
}

// Custom error handler
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

// Temporary handler stubs (to be implemented)
func handleRegister(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Register endpoint - Coming soon"})
}

func handleLogin(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Login endpoint - Coming soon"})
}

func handleVerifyMagicLink(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Magic link verify - Coming soon"})
}

func handleGoogleOAuth(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Google OAuth - Coming soon"})
}

func handleRefreshToken(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Refresh token - Coming soon"})
}

func handleGetCurrentUser(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get current user - Coming soon"})
}

func handleFileUpload(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "File upload - Coming soon"})
}

func handleBacktest(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Backtest - Coming soon"})
}

func handleGetStrategies(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get strategies - Coming soon"})
}

func jwtMiddleware(c *fiber.Ctx) error {
	// TODO: Implement JWT validation
	return c.Next()
}

// Helper function to get environment variables with default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
