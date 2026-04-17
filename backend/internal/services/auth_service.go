package services

import (
    "crypto/rand"
    "crypto/subtle" 
    "encoding/hex"
    "errors"
    "os"
    "strings"
    "time"
    
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/argon2"
)

// JWT Claims
type Claims struct {
    UserID uint   `json:"user_id"`
    Phone  string `json:"phone"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Hash password with Argon2id
func HashPassword(password string) (string, error) {
    salt := make([]byte, 16)
    if _, err := rand.Read(salt); err != nil {
        return "", err
    }
    
    // Argon2id params: time=1, memory=64MB, threads=4, keyLen=32
    hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
    
    // Format: salt:hash (both hex encoded)
    return hex.EncodeToString(salt) + ":" + hex.EncodeToString(hash), nil
}

// Verify password
func VerifyPassword(storedHash, inputPassword string) bool {
    parts := strings.Split(storedHash, ":")
    if len(parts) != 2 {
        return false
    }
    
    salt, _ := hex.DecodeString(parts[0])
    storedKey, _ := hex.DecodeString(parts[1])
    
    inputKey := argon2.IDKey([]byte(inputPassword), salt, 1, 64*1024, 4, 32)
    
    return subtle.ConstantTimeCompare(storedKey, inputKey) == 1
}

// Create Access Token (15 min expiry)
func CreateAccessToken(userID uint, phone, role string) (string, error) {
    claims := &Claims{
        UserID: userID,
        Phone:  phone,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    secret := os.Getenv("JWT_SECRET")
    return token.SignedString([]byte(secret))
}

// Create Refresh Token (7 days)
func CreateRefreshToken(userID uint) (string, error) {
    claims := &Claims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    secret := os.Getenv("JWT_REFRESH_SECRET")
    return token.SignedString([]byte(secret))
}

// Validate Access Token
func ValidateAccessToken(tokenString string) (*Claims, error) {
    secret := os.Getenv("JWT_SECRET")
    
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("invalid signing method")
        }
        return []byte(secret), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}
