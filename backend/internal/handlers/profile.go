package handlers

import (
	"payom/internal/models"
	"payom/internal/utils"
	"payom/pkg/database"

	"github.com/gofiber/fiber/v2"
)

// GET /api/v1/user/profile - Get current user profile
func GetProfile(c *fiber.Ctx) error {
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

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":             user.ID,
			"phone":          user.Phone,
			"email":          user.Email,
			"first_name":     user.FirstName,
			"last_name":      user.LastName,
			"bvn":            user.BVN,
			"wallet_balance": user.WalletBalance,
			"account_number": user.AccountNumber,
			"is_verified":    user.IsVerified,
			"role":           user.Role,
			"created_at":     user.CreatedAt,
		},
	})
}

// PUT /api/v1/user/profile - Update user profile
func UpdateProfile(c *fiber.Ctx) error {
	type UpdateProfileRequest struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
	}

	var req UpdateProfileRequest
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

	// Validate inputs
	if req.FirstName == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "first name is required",
		})
	}

	if req.LastName == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "last name is required",
		})
	}

	if req.Email == "" {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   "email is required",
		})
	}

	// Validate email format
	if err := utils.ValidateEmail(req.Email); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"success": false,
			"error":   err.Error(),
		})
	}

	// Check if email is already taken by another user
	if req.Email != user.Email {
		var existingUser models.User
		if err := database.DB.Where("email = ? AND id != ?", req.Email, userID).First(&existingUser).Error; err == nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"error":   "email already in use by another account",
			})
		}
	}

	// Update user profile
	updates := map[string]interface{}{
		"first_name": req.FirstName,
		"last_name":  req.LastName,
		"email":      req.Email,
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update profile",
		})
	}

	// Fetch updated user
	database.DB.First(&user, userID)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "profile updated successfully",
		"data": fiber.Map{
			"id":             user.ID,
			"phone":          user.Phone,
			"email":          user.Email,
			"first_name":     user.FirstName,
			"last_name":      user.LastName,
			"wallet_balance": user.WalletBalance,
			"account_number": user.AccountNumber,
			"is_verified":    user.IsVerified,
		},
	})
}
