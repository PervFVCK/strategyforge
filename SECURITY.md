# 🔐 StrategyForge Security Policy

## Security Measures
1. **Authentication**
   - Argon2id password hashing (memory: 64MB, time: 3, parallelism: 4)
   - JWT tokens (15min expiry)
   - Refresh tokens (7 days, httpOnly cookies)
   - Magic link login (passwordless)
   - Google OAuth 2.0

2. **API Security**
   - Rate limiting: 100 requests per 15 minutes per IP
   - CORS restricted to frontend domain
   - Helmet.js security headers
   - CSP (Content Security Policy)
   - Input validation and sanitization

3. **Database**
   - Prepared statements (no SQL injection)
   - GORM ORM with parameterized queries
   - Encrypted sensitive fields

4. **Infrastructure**
   - HTTPS only (enforced)
   - Secure cookies (httpOnly, secure, sameSite)
   - Environment variables for secrets
   - No secrets in code/git

## Reporting Vulnerabilities
Email: security@strategyforge.africa  
Response time: 24-48 hours

## Bug Bounty
- Critical: $500 - $2,000
- High: $200 - $500
- Medium: $50 - $200
- Low: Recognition + Hall of Fame
