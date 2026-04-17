package middleware

import (
    "strings"
    
    "payom/internal/services"
    "github.com/gofiber/fiber/v2"
)

// JWT Authentication Middleware
func JWTAuth(c *fiber.Ctx) error {
    // Get Authorization header
    authHeader := c.Get("Authorization")
    if authHeader == "" {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "missing authorization token",
        })
    }
    
    // Extract token (format: "Bearer <token>")
    parts := strings.Split(authHeader, " ")
    if len(parts) != 2 || parts[0] != "Bearer" {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid authorization format",
        })
    }
    
    token := parts[1]
    
    // Validate token
    claims, err := services.ValidateAccessToken(token)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid or expired token",
        })
    }
    
    // Store user info in context for handlers to use
    c.Locals("userID", claims.UserID)
    c.Locals("phone", claims.Phone)
    c.Locals("role", claims.Role)
    
    return c.Next()
}

// Admin-only middleware (use after JWTAuth)
func AdminOnly(c *fiber.Ctx) error {
    role := c.Locals("role").(string)
    
    if role != "admin" {
        return c.Status(403).JSON(fiber.Map{
            "success": false,
            "error":   "admin access required",
        })
    }
    
    return c.Next()
}
