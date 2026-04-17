package services

import (
    "crypto/rand"
    "errors"
    "fmt"
    "log"
    "math/big"
    "time"
    
    "payom/internal/models"
    "payom/pkg/database"
)

// Generate 6-digit OTP code
func GenerateOTP() string {
    max := big.NewInt(999999)
    n, _ := rand.Int(rand.Reader, max)
    return fmt.Sprintf("%06d", n.Int64())
}

// Create and store OTP
func CreateOTP(identifier string, purpose string, isEmail bool) (string, error) {
    code := GenerateOTP()
    expiresAt := time.Now().Add(5 * time.Minute) // 5 min expiry
    
    otp := models.OTP{
        Code:      code,
        Purpose:   purpose,
        ExpiresAt: expiresAt,
    }
    
    if isEmail {
        otp.Email = identifier
    } else {
        otp.Phone = identifier
    }
    
    if err := database.DB.Create(&otp).Error; err != nil {
        return "", err
    }
    
    // TODO: Send SMS/Email with code
    // For now, log to console (REMOVE IN PRODUCTION)
    log.Printf("📱 OTP for %s: %s (expires in 5 min)", identifier, code)
    
    return code, nil
}

// Verify OTP
func VerifyOTP(identifier string, code string, purpose string) (bool, error) {
    var otp models.OTP
    
    query := database.DB.Where("code = ? AND purpose = ? AND verified = ?", code, purpose, false)
    
    // Check if identifier is email or phone
    if len(identifier) > 11 {
        query = query.Where("email = ?", identifier)
    } else {
        query = query.Where("phone = ?", identifier)
    }
    
    if err := query.First(&otp).Error; err != nil {
        return false, errors.New("invalid or expired OTP")
    }
    
    if otp.IsExpired() {
        return false, errors.New("OTP expired")
    }
    
    // Mark as verified
    database.DB.Model(&otp).Update("verified", true)
    
    return true, nil
}

// Clean up expired OTPs (call this periodically)
func CleanExpiredOTPs() {
    database.DB.Where("expires_at < ?", time.Now()).Delete(&models.OTP{})
}
