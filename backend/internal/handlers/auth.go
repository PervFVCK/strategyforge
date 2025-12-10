package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/PervFVCK/strategyforge/internal/middleware"
	"github.com/PervFVCK/strategyforge/internal/services"
)

var authService = &services.AuthService{}

// HandleRegister handles user registration
func HandleRegister(c *fiber.Ctx) error {
	var req services.RegisterRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	// Register user
	response, err := authService.Register(req)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Registration Failed",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    response,
		"message": "Account created successfully",
	})
}

// HandleLogin handles user login
func HandleLogin(c *fiber.Ctx) error {
	var req services.LoginRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	// Login user
	response, err := authService.Login(req)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Login Failed",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    response,
		"message": "Login successful",
	})
}

// HandleSendMagicLink sends a passwordless magic link
func HandleSendMagicLink(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	if err := authService.SendMagicLink(req.Email); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Failed to Send Magic Link",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Magic link sent to your email",
	})
}

// HandleVerifyMagicLink verifies magic link token
func HandleVerifyMagicLink(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	response, err := authService.VerifyMagicLink(req.Token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Verification Failed",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    response,
		"message": "Login successful",
	})
}

// HandleRefreshToken refreshes the access token
func HandleRefreshToken(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	response, err := authService.RefreshAccessToken(req.RefreshToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Token Refresh Failed",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data":    response,
	})
}

// HandleGetCurrentUser returns the authenticated user's info
func HandleGetCurrentUser(c *fiber.Ctx) error {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
	}

	// TODO: Fetch user from database
	// For now, return placeholder
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":    userID,
			"email": c.Locals("email"),
			"isPro": c.Locals("isPro"),
		},
	})
}

// HandleLogout handles user logout
func HandleLogout(c *fiber.Ctx) error {
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
	}

	// TODO: Invalidate refresh token in database
	// For now, just return success
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Logged out successfully",
	})
}

// HandleGoogleOAuth handles Google OAuth login
func HandleGoogleOAuth(c *fiber.Ctx) error {
	var req struct {
		Credential string `json:"credential"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	// TODO: Verify Google JWT token
	// TODO: Create or find user
	// TODO: Generate tokens
	// For now, return placeholder
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Google OAuth - Coming soon",
	})
}
