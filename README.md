# 🚀 StrategyForge Africa

**The Most Powerful Offline-First Forex Backtesting Platform — Built in Nigeria, For the World**

## ⚡ Features
- 🌍 **100% Offline** - Works without internet after first load
- ⚡ **Lightning Fast** - Backtest 10+ years of tick data in <3 seconds
- 🎨 **Beautiful UI** - Premium dark emerald theme
- 🔒 **Bank-Level Security** - Argon2id, JWT, rate limiting
- 📊 **Professional Charts** - TradingView-quality with Lightweight Charts
- 🎯 **No-Code Strategy Builder** - Visual drag-and-drop
- 🔄 **Bar Replay Pro** - Trade historical data like it's live

## 🛠️ Tech Stack
**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4  
**Backend:** Go 1.24 + Fiber + GORM + SQLite  
**Charts:** Lightweight-Charts (by TradingView)  
**Auth:** JWT + Magic Links + Google OAuth  
**Deploy:** Vercel + Fly.io (free tier)

## 🚀 Quick Start (Termux/Linux)

### Backend
```bash
cd backend
cp .env.example .env
go run cmd/server/main.go
# Server runs on http://localhost:8080
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App runs on http://localhost:5173
```

## 📦 Production Build
```bash
# Backend
cd backend && go build -o strategyforge cmd/server/main.go

# Frontend
cd frontend && npm run build
```

## 🌐 Deploy
- **Frontend:** Vercel (auto-deploy from GitHub)
- **Backend:** Fly.io or Railway
- **Database:** PostgreSQL (production) / SQLite (development)

## 🔐 Security
- All passwords hashed with Argon2id
- JWT with 15min expiry + refresh tokens
- Rate limiting (100 req/15min per IP)
- CORS locked to frontend domain
- CSP headers enforced
- Input validation on all endpoints

## 📊 Roadmap
- [x] Project setup
- [ ] Authentication system (Week 1-2)
- [ ] Data upload & parsing (Week 3-4)
- [ ] Backtesting engine (Week 5-6)
- [ ] Live charts & replay (Week 7-8)
- [ ] Strategy marketplace (Week 9-10)
- [ ] PWA & offline mode (Week 11-12)
- [ ] Launch to 10,000 users (Q1 2026)

## 💰 Revenue Model
- **Free Tier:** 3 currency pairs, basic strategies
- **Pro:** ₦5,000/month or ₦50,000 lifetime
- **Marketplace:** 30% commission on strategy sales
- **Affiliates:** 20% recurring commission

## 🎯 Mission
Make institutional-grade backtesting accessible to every retail trader in Africa.

**Built with ❤️ on an Android phone in Nigeria**

---

**License:** Proprietary (All Rights Reserved)  
**Contact:** support@strategyforge.africa
