package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/PervFVCK/strategyforge/internal/middleware"
	"github.com/PervFVCK/strategyforge/internal/models"
	"github.com/PervFVCK/strategyforge/internal/utils"
	"github.com/PervFVCK/strategyforge/pkg/database"
	"gorm.io/gorm"
)

type AuthService struct{}

// RegisterRequest represents registration payload
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

// LoginRequest represents login payload
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents successful auth response
type AuthResponse struct {
	User         map[string]interface{} `json:"user"`
	Token        string                 `json:"token"`
	RefreshToken string                 `json:"refreshToken"`
}

// Register creates a new user account
func (s *AuthService) Register(req RegisterRequest) (*AuthResponse, error) {
	// Sanitize inputs
	req.Email = utils.SanitizeInput(req.Email)
	req.Name = utils.SanitizeInput(req.Name)

	// Validate email
	if !utils.ValidateEmail(req.Email) {
		return nil, errors.New("invalid email address")
	}

	// Validate password
	if err := utils.ValidatePassword(req.Password); err != nil {
		return nil, err
	}

	// Validate name
	if len(req.Name) < 2 || len(req.Name) > 100 {
		return nil, errors.New("name must be between 2 and 100 characters")
	}

	// Check if user already exists
	var existingUser models.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := models.User{
		Email:      req.Email,
		Name:       req.Name,
		Password:   hashedPassword,
		IsPro:      false,
		IsVerified: false,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	token, err := middleware.GenerateJWT(user.ID, user.Email, user.IsPro)
	if err != nil {
		return nil, err
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	// Update user with refresh token
	user.RefreshToken = refreshToken
	database.DB.Save(&user)

	return &AuthResponse{
		User:         user.PublicUser(),
		Token:        token,
		RefreshToken: refreshToken,
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(req LoginRequest) (*AuthResponse, error) {
	// Sanitize email
	req.Email = utils.SanitizeInput(req.Email)

	// Validate email
	if !utils.ValidateEmail(req.Email) {
		return nil, errors.New("invalid email address")
	}

	// Find user
	var user models.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid email or password")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Verify password
	valid, err := utils.VerifyPassword(req.Password, user.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to verify password: %w", err)
	}

	if !valid {
		return nil, errors.New("invalid email or password")
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	database.DB.Save(&user)

	// Generate tokens
	token, err := middleware.GenerateJWT(user.ID, user.Email, user.IsPro)
	if err != nil {
		return nil, err
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	// Update refresh token
	user.RefreshToken = refreshToken
	database.DB.Save(&user)

	return &AuthResponse{
		User:         user.PublicUser(),
		Token:        token,
		RefreshToken: refreshToken,
	}, nil
}

// SendMagicLink generates and sends a magic link for passwordless login
func (s *AuthService) SendMagicLink(email string) error {
	// Sanitize email
	email = utils.SanitizeInput(email)

	// Validate email
	if !utils.ValidateEmail(email) {
		return errors.New("invalid email address")
	}

	// Find user
	var user models.User
	if err := database.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Generate magic link token
	token, err := utils.GenerateMagicLinkToken()
	if err != nil {
		return fmt.Errorf("failed to generate token: %w", err)
	}

	// Set expiry (15 minutes)
	expiry := time.Now().Add(15 * time.Minute)
	user.MagicToken = token
	user.TokenExpiry = &expiry

	if err := database.DB.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to save token: %w", err)
	}

	// TODO: Send email with magic link
	// For now, just log it
	fmt.Printf("🔗 Magic link for %s: /verify?token=%s\n", email, token)

	return nil
}

// VerifyMagicLink verifies a magic link token and logs in user
func (s *AuthService) VerifyMagicLink(token string) (*AuthResponse, error) {
	// Find user with this token
	var user models.User
	if err := database.DB.Where("magic_token = ?", token).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid or expired magic link")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check expiry
	if user.TokenExpiry == nil || time.Now().After(*user.TokenExpiry) {
		return nil, errors.New("magic link has expired")
	}

	// Clear magic token
	user.MagicToken = ""
	user.TokenExpiry = nil
	user.IsVerified = true
	now := time.Now()
	user.LastLoginAt = &now
	database.DB.Save(&user)

	// Generate tokens
	jwtToken, err := middleware.GenerateJWT(user.ID, user.Email, user.IsPro)
	if err != nil {
		return nil, err
	}

	refreshToken, err := middleware.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	user.RefreshToken = refreshToken
	database.DB.Save(&user)

	return &AuthResponse{
		User:         user.PublicUser(),
		Token:        jwtToken,
		RefreshToken: refreshToken,
	}, nil
}

// RefreshAccessToken generates a new access token using refresh token
func (s *AuthService) RefreshAccessToken(refreshToken string) (*AuthResponse, error) {
	// Find user with this refresh token
	var user models.User
	if err := database.DB.Where("refresh_token = ?", refreshToken).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid refresh token")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Generate new tokens
	token, err := middleware.GenerateJWT(user.ID, user.Email, user.IsPro)
	if err != nil {
		return nil, err
	}

	newRefreshToken, err := middleware.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	// Update refresh token
	user.RefreshToken = newRefreshToken
	database.DB.Save(&user)

	return &AuthResponse{
		User:         user.PublicUser(),
		Token:        token,
		RefreshToken: newRefreshToken,
	}, nil
}
