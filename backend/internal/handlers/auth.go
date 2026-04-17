package handlers

import (
    
    "time"
    
    "payom/internal/models"
    "payom/internal/services"
    "payom/internal/utils"
    "payom/pkg/database"
    
    "github.com/gofiber/fiber/v2"
)

// POST /auth/register - Step 1: Create account and send OTP
func Register(c *fiber.Ctx) error {
    type RegisterRequest struct {
        Phone     string `json:"phone"`
        Email     string `json:"email"`
        Password  string `json:"password"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
    }
    
    var req RegisterRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Validate inputs
    if err := utils.ValidatePhone(req.Phone); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   err.Error(),
        })
    }
    
    if err := utils.ValidateEmail(req.Email); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   err.Error(),
        })
    }
    
    if err := utils.ValidatePassword(req.Password); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   err.Error(),
        })
    }
    
    // Check if user already exists
    var existingUser models.User
    if err := database.DB.Where("phone = ? OR email = ?", req.Phone, req.Email).First(&existingUser).Error; err == nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "phone or email already registered",
        })
    }
    
    // Hash password
    hashedPassword, err := services.HashPassword(req.Password)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to process password",
        })
    }
    
    // Create user (inactive until OTP verified)
    user := models.User{
        Phone:     req.Phone,
        Email:     req.Email,
        Password:  hashedPassword,
        FirstName: req.FirstName,
        LastName:  req.LastName,
        IsActive:  false,
    }
    
    if err := database.DB.Create(&user).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to create account",
        })
    }
    
    // Generate and send OTP to phone
    code, err := services.CreateOTP(req.Phone, "register", false)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to send OTP",
        })
    }
    
    return c.Status(201).JSON(fiber.Map{
        "success": true,
        "message": "account created, OTP sent to phone",
        "data": fiber.Map{
            "user_id": user.ID,
            "phone":   user.Phone,
            "code":    code, // REMOVE IN PRODUCTION! Only for testing
        },
    })
}

// POST /auth/verify-otp - Step 2: Verify OTP and activate account
func VerifyOTP(c *fiber.Ctx) error {
    type VerifyRequest struct {
        Phone   string `json:"phone"`
        Code    string `json:"code"`
        Purpose string `json:"purpose"` // register/login/reset
    }
    
    var req VerifyRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Verify OTP
    valid, err := services.VerifyOTP(req.Phone, req.Code, req.Purpose)
    if !valid || err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid or expired OTP",
        })
    }
    
    // If registration OTP, activate user
    if req.Purpose == "register" {
        var user models.User
        if err := database.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
            return c.Status(404).JSON(fiber.Map{
                "success": false,
                "error":   "user not found",
            })
        }
        
        // Activate account
        database.DB.Model(&user).Updates(map[string]interface{}{
            "is_active": true,
        })
        
        return c.JSON(fiber.Map{
            "success": true,
            "message": "account verified successfully",
            "data": fiber.Map{
                "user_id": user.ID,
                "next_step": "set_pin",
            },
        })
    }
    
    // If login OTP, generate tokens
    if req.Purpose == "login" {
        var user models.User
        if err := database.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
            return c.Status(404).JSON(fiber.Map{
                "success": false,
                "error":   "user not found",
            })
        }
        
        // Generate tokens
        accessToken, _ := services.CreateAccessToken(user.ID, user.Phone, user.Role)
        refreshToken, _ := services.CreateRefreshToken(user.ID)
        
        // Update last login
        now := time.Now()
        database.DB.Model(&user).Updates(map[string]interface{}{
            "last_login_ip": c.IP(),
            "last_login_at": &now,
        })
        
        return c.JSON(fiber.Map{
            "success": true,
            "message": "login successful",
            "data": fiber.Map{
                "access_token":  accessToken,
                "refresh_token": refreshToken,
                "user": fiber.Map{
                    "id":             user.ID,
                    "phone":          user.Phone,
                    "email":          user.Email,
                    "first_name":     user.FirstName,
                    "last_name":      user.LastName,
                    "wallet_balance": user.WalletBalance,
                    "account_number": user.AccountNumber,
                    "is_verified":    user.IsVerified,
                },
            },
        })
    }
    
    return c.JSON(fiber.Map{
        "success": true,
        "message": "OTP verified",
    })
}

// POST /auth/set-pin - Step 3: Set 4-digit PIN (after registration)
func SetPIN(c *fiber.Ctx) error {
    type PINRequest struct {
        UserID uint   `json:"user_id"`
        PIN    string `json:"pin"`
    }
    
    var req PINRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Validate PIN
    if err := utils.ValidatePIN(req.PIN); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   err.Error(),
        })
    }
    
    // Hash PIN
    hashedPIN, err := services.HashPassword(req.PIN)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to process PIN",
        })
    }
    
    // Update user
    var user models.User
    if err := database.DB.First(&user, req.UserID).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{
            "success": false,
            "error":   "user not found",
        })
    }
    
    database.DB.Model(&user).Update("pin", hashedPIN)
    
    // Generate tokens for first login
    accessToken, _ := services.CreateAccessToken(user.ID, user.Phone, user.Role)
    refreshToken, _ := services.CreateRefreshToken(user.ID)
    
    return c.JSON(fiber.Map{
        "success": true,
        "message": "PIN set successfully",
        "data": fiber.Map{
            "access_token":  accessToken,
            "refresh_token": refreshToken,
            "user": fiber.Map{
                "id":             user.ID,
                "phone":          user.Phone,
                "email":          user.Email,
                "wallet_balance": user.WalletBalance,
                "account_number": user.AccountNumber,
            },
        },
    })
}

// POST /auth/login - Login with email/phone + password, then send OTP
func Login(c *fiber.Ctx) error {
    type LoginRequest struct {
        Identifier string `json:"identifier"` // phone or email
        Password   string `json:"password"`
    }
    
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Find user by phone or email
    var user models.User
    if err := database.DB.Where("phone = ? OR email = ?", req.Identifier, req.Identifier).First(&user).Error; err != nil {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid credentials",
        })
    }
    
    // Check if account is active
    if !user.IsActive {
        return c.Status(403).JSON(fiber.Map{
            "success": false,
            "error":   "account not verified, please complete registration",
        })
    }
    
    // Verify password
    if !services.VerifyPassword(user.Password, req.Password) {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid credentials",
        })
    }
    
    // Send OTP to phone
    code, err := services.CreateOTP(user.Phone, "login", false)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to send OTP",
        })
    }
    
    return c.JSON(fiber.Map{
        "success": true,
        "message": "OTP sent to phone",
        "data": fiber.Map{
            "phone": user.Phone,
            "code":  code, // REMOVE IN PRODUCTION!
        },
    })
}

// POST /auth/login-pin - Quick login with 4-digit PIN
func LoginWithPIN(c *fiber.Ctx) error {
    type PINLoginRequest struct {
        Phone string `json:"phone"`
        PIN   string `json:"pin"`
    }
    
    var req PINLoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Find user
    var user models.User
    if err := database.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid credentials",
        })
    }
    
    // Verify PIN
    if user.PIN == "" {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "PIN not set, please use password login",
        })
    }
    
    if !services.VerifyPassword(user.PIN, req.PIN) {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid PIN",
        })
    }
    
    // Generate tokens
    accessToken, _ := services.CreateAccessToken(user.ID, user.Phone, user.Role)
    refreshToken, _ := services.CreateRefreshToken(user.ID)
    
    // Update last login
    now := time.Now()
    database.DB.Model(&user).Updates(map[string]interface{}{
        "last_login_ip": c.IP(),
        "last_login_at": &now,
    })
    
    return c.JSON(fiber.Map{
        "success": true,
        "message": "login successful",
        "data": fiber.Map{
            "access_token":  accessToken,
            "refresh_token": refreshToken,
            "user": fiber.Map{
                "id":             user.ID,
                "phone":          user.Phone,
                "email":          user.Email,
                "first_name":     user.FirstName,
                "last_name":      user.LastName,
                "wallet_balance": user.WalletBalance,
                "account_number": user.AccountNumber,
                "is_verified":    user.IsVerified,
            },
        },
    })
}

// POST /auth/refresh - Refresh access token
func RefreshToken(c *fiber.Ctx) error {
    type RefreshRequest struct {
        RefreshToken string `json:"refresh_token"`
    }
    
    var req RefreshRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Validate refresh token (create ValidateRefreshToken in auth_service.go)
    claims, err := services.ValidateAccessToken(req.RefreshToken) // TODO: Make separate function
    if err != nil {
        return c.Status(401).JSON(fiber.Map{
            "success": false,
            "error":   "invalid refresh token",
        })
    }
    
    // Get user
    var user models.User
    if err := database.DB.First(&user, claims.UserID).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{
            "success": false,
            "error":   "user not found",
        })
    }
    
    // Generate new access token
    newAccessToken, _ := services.CreateAccessToken(user.ID, user.Phone, user.Role)
    
    return c.JSON(fiber.Map{
        "success": true,
        "data": fiber.Map{
            "access_token": newAccessToken,
        },
    })
}

// GET /auth/me - Get current user info (protected route)
func GetCurrentUser(c *fiber.Ctx) error {
    userID := c.Locals("userID").(uint)
    
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
            "wallet_balance": user.WalletBalance,
            "account_number": user.AccountNumber,
            "is_verified":    user.IsVerified,
            "role":           user.Role,
            "created_at":     user.CreatedAt,
        },
    })
  }

    // POST /auth/reset-password - Reset password after OTP verification
func ResetPassword(c *fiber.Ctx) error {
    type ResetRequest struct {
        Phone       string `json:"phone"`
        NewPassword string `json:"new_password"`
    }

    var req ResetRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }

    // Validate password
    if err := utils.ValidatePassword(req.NewPassword); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   err.Error(),
        })
    }

    // Find user by phone
    var user models.User
    if err := database.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{
            "success": false,
            "error":   "user not found",
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

    // Update password
    database.DB.Model(&user).Update("password", hashedPassword)

    return c.JSON(fiber.Map{
        "success": true,
        "message": "password reset successfully",
    })
}

  // POST /auth/forgot-password - Request password reset OTP
func ForgotPassword(c *fiber.Ctx) error {
    type ForgotRequest struct {
        Identifier string `json:"identifier"` // email or phone
    }
    
    var req ForgotRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error":   "invalid request body",
        })
    }
    
    // Find user by phone or email
    var user models.User
    if err := database.DB.Where("phone = ? OR email = ?", req.Identifier, req.Identifier).First(&user).Error; err != nil {
        // For security, don't reveal if user exists or not
        // Return success anyway
        return c.JSON(fiber.Map{
            "success": true,
            "message": "if account exists, reset code has been sent",
            "data": fiber.Map{
                "phone": req.Identifier, // Will be masked on frontend
            },
        })
    }
    
    // Generate and send OTP to user's phone
    code, err := services.CreateOTP(user.Phone, "reset", false)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{
            "success": false,
            "error":   "failed to send reset code",
        })
    }
    
    return c.JSON(fiber.Map{
        "success": true,
        "message": "reset code sent to your phone",
        "data": fiber.Map{
            "phone": user.Phone,
            "code":  code, // REMOVE IN PRODUCTION
        },
    })
}
