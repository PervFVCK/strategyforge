package main

import (
    "log"
    "os"
    
    "payom/internal/handlers"
    "payom/internal/middleware"
    "payom/internal/models"
    "payom/pkg/database"
    
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "github.com/joho/godotenv"
    
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("⚠️  No .env file found, using system env")
    }
    
    // Connect to database
    database.Connect()
    
    // Auto-migrate models
    database.Migrate(&models.User{}, &models.OTP{})
    
    // Initialize Fiber app
    app := fiber.New(fiber.Config{
        ErrorHandler: func(c *fiber.Ctx, err error) error {
            code := fiber.StatusInternalServerError
            if e, ok := err.(*fiber.Error); ok {
                code = e.Code
            }
            return c.Status(code).JSON(fiber.Map{
                "success": false,
                "error":   err.Error(),
            })
        },
    })
    
    // Global middleware
    app.Use(recover.New())
    app.Use(logger.New())
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*", // Change to frontend URL in production
        AllowHeaders: "Origin, Content-Type, Accept, Authorization",
        AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
    }))
    
    // Health check
    app.Get("/health", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{
            "status":  "ok",
            "message": "PayOM API is running 🚀",
            "version": "1.0.0",
        })
    })
    
    // API v1 routes
    api := app.Group("/api/v1")
    
    // ========================================
    // AUTH ROUTES (PUBLIC)
    // ========================================
    auth := api.Group("/auth")
    auth.Post("/register", middleware.RateLimiter(), handlers.Register)
    auth.Post("/verify-otp", middleware.OTPRateLimiter(), handlers.VerifyOTP)
    auth.Post("/set-pin", handlers.SetPIN)
    auth.Post("/login", middleware.RateLimiter(), handlers.Login)
    auth.Post("/login-pin", middleware.RateLimiter(), handlers.LoginWithPIN)
    auth.Post("/refresh", handlers.RefreshToken)
    auth.Post("/reset-password", handlers.ResetPassword)
    auth.Post("/forgot-password", middleware.RateLimiter(), handlers.ForgotPassword)
    
    // Protected auth routes
    auth.Get("/me", middleware.JWTAuth, handlers.GetCurrentUser)

    // ========================================
    // USER ROUTES (PROTECTED)
    // ========================================
    user := api.Group("/user")
    user.Use(middleware.JWTAuth)
    user.Post("/change-password", handlers.ChangePassword)
    user.Post("/change-pin", handlers.ChangePIN)
    user.Get("/profile", handlers.GetProfile)
    user.Put("/profile", handlers.UpdateProfile)

    
    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "3000"
    }
    
    log.Printf("🚀 PayOM Backend running on http://localhost:%s", port)
    log.Printf("📚 Health Check: http://localhost:%s/health", port)
    
    if err := app.Listen(":" + port); err != nil {
        log.Fatal("Failed to start server:", err)
    }



}
