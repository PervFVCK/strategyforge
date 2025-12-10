package middleware

import (
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents the JWT payload
type JWTClaims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	IsPro  bool   `json:"isPro"`
	jwt.RegisteredClaims
}

// GenerateJWT generates a new JWT token for a user
func GenerateJWT(userID, email string, isPro bool) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fiber.NewError(fiber.StatusInternalServerError, "JWT secret not configured")
	}

	expiryDuration := 15 * time.Minute // 15 minutes
	if expiry := os.Getenv("JWT_EXPIRY"); expiry != "" {
		if d, err := time.ParseDuration(expiry); err == nil {
			expiryDuration = d
		}
	}

	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		IsPro:  isPro,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiryDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "strategyforge",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateRefreshToken generates a refresh token (longer expiry)
func GenerateRefreshToken(userID string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fiber.NewError(fiber.StatusInternalServerError, "JWT secret not configured")
	}

	expiryDuration := 168 * time.Hour // 7 days
	if expiry := os.Getenv("REFRESH_TOKEN_EXPIRY"); expiry != "" {
		if d, err := time.ParseDuration(expiry); err == nil {
			expiryDuration = d
		}
	}

	claims := jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiryDuration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "strategyforge-refresh",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT validates and parses a JWT token
func ValidateJWT(tokenString string) (*JWTClaims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "JWT secret not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid or expired token")
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid token claims")
}

// JWTMiddleware protects routes that require authentication
func JWTMiddleware(c *fiber.Ctx) error {
	// Extract token from Authorization header
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "Missing authorization token",
		})
	}

	// Check Bearer format
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "Invalid authorization format. Use: Bearer <token>",
		})
	}

	tokenString := parts[1]

	// Validate token
	claims, err := ValidateJWT(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": err.Error(),
		})
	}

	// Store user info in context
	c.Locals("userID", claims.UserID)
	c.Locals("email", claims.Email)
	c.Locals("isPro", claims.IsPro)

	return c.Next()
}

// GetUserIDFromContext extracts user ID from Fiber context
func GetUserIDFromContext(c *fiber.Ctx) string {
	userID, ok := c.Locals("userID").(string)
	if !ok {
		return ""
	}
	return userID
}

// RequireProMiddleware ensures user has Pro subscription
func RequireProMiddleware(c *fiber.Ctx) error {
	isPro, ok := c.Locals("isPro").(bool)
	if !ok || !isPro {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Forbidden",
			"message": "This feature requires StrategyForge Pro subscription",
			"upgrade": "Visit /pricing to upgrade",
		})
	}
	return c.Next()
}
