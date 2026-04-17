package models

import (
    "fmt"
    "math/rand"
    "time"
    "gorm.io/gorm"
)

type User struct {
    ID              uint           `gorm:"primaryKey" json:"id"`
    Phone           string         `gorm:"uniqueIndex;size:15;not null" json:"phone"`
    Email           string         `gorm:"uniqueIndex;not null" json:"email"`
    Password        string         `gorm:"not null" json:"-"` // Argon2 hashed
    PIN             string         `gorm:"size:4" json:"-"`   // 4-digit PIN (hashed)
    
    // Profile
    FirstName       string         `gorm:"size:50" json:"first_name"`
    LastName        string         `gorm:"size:50" json:"last_name"`
    
    // KYC
    BVN             string         `gorm:"size:11" json:"bvn,omitempty"`
    NIN             string         `gorm:"size:11" json:"nin,omitempty"`
    IsVerified      bool           `gorm:"default:false" json:"is_verified"`
    
    // Wallet
    WalletBalance   float64        `gorm:"default:0" json:"wallet_balance"`
    AccountNumber   string         `gorm:"uniqueIndex;size:10" json:"account_number"` // Our internal account number
    
    // Security
    IsActive        bool           `gorm:"default:false" json:"is_active"` // True after OTP verify
    Role            string         `gorm:"default:user" json:"role"`       // user/admin
    LastLoginIP     string         `json:"last_login_ip,omitempty"`
    LastLoginAt     *time.Time     `json:"last_login_at,omitempty"`
    
    
    // Timestamps
    CreatedAt       time.Time      `json:"created_at"`
    UpdatedAt       time.Time      `json:"updated_at"`
    DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// Generate random account number (10 digits starting with 1)
func (u *User) BeforeCreate(tx *gorm.DB) error {
    if u.AccountNumber == "" {
        // Simple generation (improve in production with proper sequencing)
        u.AccountNumber = "10" + fmt.Sprintf("%08d", rand.Intn(99999999))
    }
    return nil
}

