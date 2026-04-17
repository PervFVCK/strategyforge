package middleware

import (
    "time"
    
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/limiter"
)

// Rate limiter for sensitive endpoints (login, register, OTP)
func RateLimiter() fiber.Handler {
    return limiter.New(limiter.Config{
        Max:        5,                    // 5 requests
        Expiration: 1 * time.Minute,      // per minute
        KeyGenerator: func(c *fiber.Ctx) string {
            // Use IP address as key
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(429).JSON(fiber.Map{
                "success": false,
                "error":   "too many requests, please try again later",
            })
        },
        Storage: nil, // Use in-memory (switch to Redis in production)
    })
}

// Stricter rate limit for OTP endpoints (prevent spam)
func OTPRateLimiter() fiber.Handler {
    return limiter.New(limiter.Config{
        Max:        3,                    // 3 OTP requests
        Expiration: 5 * time.Minute,      // per 5 minutes
        KeyGenerator: func(c *fiber.Ctx) string {
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(429).JSON(fiber.Map{
                "success": false,
                "error":   "OTP request limit reached, wait 5 minutes",
            })
        },
    })
}
