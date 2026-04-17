package models

import (
    "time"
)

type OTP struct {
    ID        uint      `gorm:"primaryKey" json:"id"`
    Phone     string    `gorm:"index;size:15" json:"phone"`
    Email     string    `gorm:"index" json:"email"`
    Code      string    `gorm:"size:6;not null" json:"code"` // 6-digit code
    Purpose   string    `gorm:"size:20;not null" json:"purpose"` // register/login/reset
    ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
    Verified  bool      `gorm:"default:false" json:"verified"`
    CreatedAt time.Time `json:"created_at"`
}

// Check if OTP is expired
func (o *OTP) IsExpired() bool {
    return time.Now().After(o.ExpiresAt)
}
