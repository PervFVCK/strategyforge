package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a StrategyForge user
type User struct {
	ID           string         `gorm:"primaryKey;type:uuid" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	Name         string         `gorm:"not null" json:"name"`
	Password     string         `gorm:"not null" json:"-"` // Never send to client
	Avatar       string         `gorm:"default:null" json:"avatar,omitempty"`
	IsPro        bool           `gorm:"default:false" json:"isPro"`
	IsVerified   bool           `gorm:"default:false" json:"isVerified"`
	GoogleID     string         `gorm:"uniqueIndex;default:null" json:"-"`
	MagicToken   string         `gorm:"index;default:null" json:"-"`
	TokenExpiry  *time.Time     `gorm:"default:null" json:"-"`
	RefreshToken string         `gorm:"default:null" json:"-"`
	LastLoginAt  *time.Time     `json:"lastLoginAt,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate hook - generate UUID before creating user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// PublicUser returns user data safe for client response
func (u *User) PublicUser() map[string]interface{} {
	return map[string]interface{}{
		"id":          u.ID,
		"email":       u.Email,
		"name":        u.Name,
		"avatar":      u.Avatar,
		"isPro":       u.IsPro,
		"isVerified":  u.IsVerified,
		"lastLoginAt": u.LastLoginAt,
		"createdAt":   u.CreatedAt,
	}
}

// Strategy represents a trading strategy
type Strategy struct {
	ID          string         `gorm:"primaryKey;type:uuid" json:"id"`
	UserID      string         `gorm:"index;not null" json:"userId"`
	Name        string         `gorm:"not null" json:"name"`
	Description string         `json:"description"`
	Code        string         `gorm:"type:text;not null" json:"code"`
	IsPublic    bool           `gorm:"default:false" json:"isPublic"`
	Price       float64        `gorm:"default:0" json:"price"`
	Downloads   int            `gorm:"default:0" json:"downloads"`
	Rating      float64        `gorm:"default:0" json:"rating"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// BeforeCreate hook for Strategy
func (s *Strategy) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// BacktestResult stores backtest execution results
type BacktestResult struct {
	ID            string    `gorm:"primaryKey;type:uuid" json:"id"`
	UserID        string    `gorm:"index;not null" json:"userId"`
	StrategyID    string    `gorm:"index" json:"strategyId,omitempty"`
	Pair          string    `gorm:"not null" json:"pair"`
	Timeframe     string    `gorm:"not null" json:"timeframe"`
	StartDate     time.Time `json:"startDate"`
	EndDate       time.Time `json:"endDate"`
	InitialBalance float64  `json:"initialBalance"`
	FinalBalance   float64  `json:"finalBalance"`
	TotalTrades    int      `json:"totalTrades"`
	WinRate        float64  `json:"winRate"`
	ProfitFactor   float64  `json:"profitFactor"`
	MaxDrawdown    float64  `json:"maxDrawdown"`
	ResultData     string   `gorm:"type:text" json:"-"` // JSON stored as text
	CreatedAt      time.Time `json:"createdAt"`
}

// BeforeCreate hook for BacktestResult
func (b *BacktestResult) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}
