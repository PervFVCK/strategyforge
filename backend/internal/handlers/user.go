package handlers

import (
	"payom/internal/models"
	"payom/internal/services"
	"payom/internal/utils"
	"payom/pkg/database"

	"github.com/gofiber/fiber/v2"
)

// POST /api/v1/user/change-password - Change user password
func ChangePassword(c *fiber.Ctx) error {
	type ChangePasswordRequest struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}

	var req ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	// Get user ID from JWT middleware
	userID := c.Locals("userID").(uint)

	// Get user from database
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error":   "user not found",
		})
	}

	// Verify current password
	if !services.VerifyPassword(user.Password, req.CurrentPassword) {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "current password is incorrect",
		})
	}

	// Validate new password
	if err := utils.ValidatePassword(req.NewPassword); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	// Check if new password is same as current
	if req.CurrentPassword == req.NewPassword {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "new password must be different from current password",
		})
	}

	// Hash new password
	hashedPassword, err := services.HashPassword(req.NewPassword)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "failed to process password",
		})
	}

	// Update password in database
	if err := database.DB.Model(&user).Update("password", hashedPassword).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update password",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "password changed successfully",
	})
}

// POST /api/v1/user/change-pin - Change user PIN
func ChangePIN(c *fiber.Ctx) error {
	type ChangePINRequest struct {
		CurrentPIN string `json:"current_pin"`
		NewPIN     string `json:"new_pin"`
	}

	var req ChangePINRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	// Get user ID from JWT middleware
	userID := c.Locals("userID").(uint)

	// Get user from database
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"success": false,
			"error":   "user not found",
		})
	}

	// Check if PIN is set
	if user.PIN == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "PIN not set",
		})
	}

	// Verify current PIN
	if !services.VerifyPassword(user.PIN, req.CurrentPIN) {
		return c.Status(401).JSON(fiber.Map{
			"success": false,
			"error":   "current PIN is incorrect",
		})
	}

	// Validate new PIN
	if err := utils.ValidatePIN(req.NewPIN); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	// Check if new PIN is same as current
	if req.CurrentPIN == req.NewPIN {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "new PIN must be different from current PIN",
		})
	}

	// Hash new PIN
	hashedPIN, err := services.HashPassword(req.NewPIN)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "failed to process PIN",
		})
	}

	// Update PIN in database
	if err := database.DB.Model(&user).Update("pin", hashedPIN).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update PIN",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "PIN changed successfully",
	})
}
