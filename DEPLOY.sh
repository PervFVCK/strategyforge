#!/bin/bash

# StrategyForge Africa - Complete Setup Script for Termux
# Run this after cloning from GitHub

set -e  # Exit on error

echo "🚀 StrategyForge Africa - Production Setup"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in Termux
if [ -z "$PREFIX" ]; then
    echo -e "${RED}❌ This script must be run in Termux${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Step 1: Installing system dependencies...${NC}"
pkg update -y
pkg upgrade -y
pkg install -y git golang nodejs python3 openssl-tool

echo ""
echo -e "${BLUE}📦 Step 2: Setting up Backend (Go)...${NC}"
cd backend

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s|your-super-secret-jwt-key-change-this-in-production-min-32-chars|$JWT_SECRET|g" .env
    
    echo -e "${GREEN}✅ Backend .env created with secure JWT secret${NC}"
else
    echo -e "${GREEN}✅ Backend .env already exists${NC}"
fi

# Initialize Go module if not already done
if [ ! -f go.mod ]; then
    echo -e "${YELLOW}Initializing Go module...${NC}"
    go mod init github.com/yourusername/strategyforge
fi

# Install Go dependencies
echo -e "${YELLOW}Installing Go dependencies...${NC}"
go get github.com/gofiber/fiber/v2
go get github.com/gofiber/fiber/v2/middleware/cors
go get github.com/gofiber/fiber/v2/middleware/limiter
go get github.com/gofiber/fiber/v2/middleware/helmet
go get github.com/gofiber/fiber/v2/middleware/logger
go get github.com/gofiber/fiber/v2/middleware/recover
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/argon2
go get gorm.io/gorm
go get gorm.io/driver/sqlite
go get github.com/joho/godotenv
go get github.com/google/uuid

echo -e "${GREEN}✅ Go dependencies installed${NC}"

# Tidy up
go mod tidy

echo ""
echo -e "${BLUE}📦 Step 3: Setting up Frontend (React + TypeScript)...${NC}"
cd ../frontend

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${GREEN}✅ Frontend .env already exists${NC}"
fi

# Install Node dependencies
echo -e "${YELLOW}Installing npm dependencies (this may take a while)...${NC}"
npm install

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ StrategyForge Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}🚀 To start development:${NC}"
echo ""
echo -e "${YELLOW}Backend:${NC}"
echo "  cd backend"
echo "  go run cmd/server/main.go"
echo "  → http://localhost:8080"
echo ""
echo -e "${YELLOW}Frontend:${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo "  → http://localhost:5173"
echo ""
echo -e "${BLUE}📚 Next Steps:${NC}"
echo "1. Update backend/.env with your Google OAuth credentials"
echo "2. Update frontend/.env with VITE_GOOGLE_CLIENT_ID"
echo "3. Start implementing Phase 1: Authentication System"
echo ""
echo -e "${GREEN}💰 Remember: We're building a multi-million dollar product${NC}"
echo -e "${GREEN}🌍 Built in Nigeria. For Africa. For the World.${NC}"
echo ""
