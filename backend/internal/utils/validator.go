package utils

import (
    "errors"
    "regexp"
    "strings"
)

// Validate phone number (Nigerian format: 080xxxxxxxx or +234xxxxxxxxxx)
func ValidatePhone(phone string) error {
    phone = strings.ReplaceAll(phone, " ", "")
    
    nigerianPhone := regexp.MustCompile(`^(0[789][01]\d{8}|(\+234)[789][01]\d{8})$`)
    
    if !nigerianPhone.MatchString(phone) {
        return errors.New("invalid Nigerian phone number")
    }
    
    return nil
}

// Validate email
func ValidateEmail(email string) error {
    emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    
    if !emailRegex.MatchString(email) {
        return errors.New("invalid email format")
    }
    
    return nil
}

// Validate password strength
func ValidatePassword(password string) error {
    if len(password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    
    hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
    hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
    hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
    
    if !hasUpper || !hasLower || !hasNumber {
        return errors.New("password must contain uppercase, lowercase, and numbers")
    }
    
    return nil
}

// Validate PIN (4 digits)
func ValidatePIN(pin string) error {
    if len(pin) != 4 {
        return errors.New("PIN must be 4 digits")
    }
    
    pinRegex := regexp.MustCompile(`^\d{4}$`)
    if !pinRegex.MatchString(pin) {
        return errors.New("PIN must contain only numbers")
    }
    
    return nil
}
