package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/PervFVCK/strategyforge/internal/middleware"
	"github.com/PervFVCK/strategyforge/internal/services"
)

// HandleBacktest executes a backtest
func HandleBacktest(c *fiber.Ctx) error {
	// Get user ID
	userID := middleware.GetUserIDFromContext(c)
	if userID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
	}

	// Parse request
	var req services.BacktestRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Invalid request payload",
		})
	}

	// Validate request
	if req.Strategy == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Strategy is required",
		})
	}

	if len(req.Data) < 100 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Bad Request",
			"message": "Insufficient data: need at least 100 candles",
		})
	}

	if req.InitialBalance <= 0 {
		req.InitialBalance = 10000 // Default $10,000
	}

	if req.RiskPerTrade <= 0 {
		req.RiskPerTrade = 2 // Default 2% per trade
	}

	// Run backtest
	engine := &services.BacktestEngine{}
	result, err := engine.RunBacktest(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Backtest Failed",
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Backtest completed successfully",
		"data":    result,
	})
}
