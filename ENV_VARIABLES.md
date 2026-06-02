# Environment Variables Reference

Complete reference for all environment variables used by CodeVault in different deployment environments.

## Quick Reference

| Variable | Frontend | Backend | Required | Default |
|----------|----------|---------|----------|---------|
| VITE_BACKEND_URL | ✅ | | ✅ (prod) | http://localhost:3000 |
| DATABASE_URL | | ✅ | ✅ (prod) | |
| JWT_SECRET | | ✅ | ✅ (prod) | |
| NODE_ENV | | ✅ | ✅ | development |
| PORT | | ✅ | | 3000 |
| FRONTEND_URL | | ✅ | ✅ (prod) | |
| FRONTEND_URLS | | ✅ | | |
| ALLOW_VERCEL_PREVIEWS | | ✅ | | false |
| COOKIE_SECURE | | ✅ | | false |
| COOKIE_SAMESITE | | ✅ | | lax |

## Frontend Variables

### VITE_BACKEND_URL

**Type**: URL  
**Required**: Yes (in production)  
**Default**: http://localhost:3000  
**Description**: Base URL for the backend API

**Examples**:
```env
# Development
VITE_BACKEND_URL=http://localhost:3000

# Production
VITE_BACKEND_URL=https://codevault-api.onrender.com

# Staging
VITE_BACKEND_URL=https://staging-api.example.com
```

**Usage in Code**:
```javascript
// src/config/api.js
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
```

## Backend Variables

### DATABASE_URL

**Type**: PostgreSQL Connection String  
**Required**: Yes  
**Format**: `postgresql://user:password@host:port/database?params`  
**Description**: Complete PostgreSQL connection string for Prisma

**Examples**:
```env
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/codevault

# Neon production
DATABASE_URL=postgresql://user:password@ep-xxxx-pooler.region.compute.neon.tech/database?sslmode=require&channel_binding=require

# Supabase
DATABASE_URL=postgresql://postgres.xxxx:password@xxxx.pooler.supabase.com:6543/postgres
```

**Parameters**:
- `sslmode=require`: Enforce SSL connection (required for remote databases)
- `channel_binding=require`: Channel binding for additional security (Neon)
- `connect_timeout=10`: Connection timeout in seconds

**Connection Troubleshooting**:
```bash
# Test connection
psql "$DATABASE_URL"

# Check connection string format
echo $DATABASE_URL

# Verify SSL is working
curl --cacert /etc/ssl/certs/ca-certificates.crt postgresql://...
```

### JWT_SECRET

**Type**: String  
**Required**: Yes (production)  
**Minimum Length**: 32 characters recommended  
**Description**: Secret key for signing JWT tokens

**Generation**:
```bash
# Generate secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Security Best Practices**:
- ✅ Use cryptographically secure random string
- ✅ Minimum 32 characters
- ✅ Rotate periodically
- ✅ Different value for each environment
- ❌ Never commit to repository
- ❌ Never share or log
- ❌ Don't use weak/predictable strings

**Examples**:
```env
# Development (non-secret, for local testing)
JWT_SECRET=dev-key-do-not-use-in-production

# Production (must be secure)
JWT_SECRET=a8f3k9x2j7m4n1p0q5r8t2v9w3x6y8z1a4b7c0d3e6f9i2l5o8r1u4x7a0c3
```

### NODE_ENV

**Type**: String  
**Required**: Yes  
**Values**: `development`, `production`  
**Default**: `development`  
**Description**: Application environment mode

**Effects**:
- `development`:
  - Detailed error messages with stack traces
  - CORS allows all origins
  - Rate limiting is lenient (1000 req/min)
  - Logging is verbose
  
- `production`:
  - Minimal error messages
  - CORS restricted to allowed origins only
  - Rate limiting is strict (300 req/min)
  - Errors logged but not exposed

**Examples**:
```env
NODE_ENV=development
NODE_ENV=production
```

### PORT

**Type**: Number  
**Required**: No  
**Default**: 3000  
**Description**: Port for Express server to listen on

**Examples**:
```env
PORT=3000
PORT=8080
PORT=5000
```

**Note**: On Vercel/Render, PORT is often auto-assigned. Use the default.

### FRONTEND_URL

**Type**: URL  
**Required**: Yes (production)  
**Description**: Primary frontend domain for CORS and cookies

**Examples**:
```env
# Development
FRONTEND_URL=http://localhost:5173

# Production
FRONTEND_URL=https://code-vault-taupe.vercel.app

# Custom domain
FRONTEND_URL=https://snippets.example.com
```

### FRONTEND_URLS

**Type**: Comma-separated URLs  
**Required**: No  
**Default**: (empty)  
**Description**: Additional frontend URLs allowed by CORS

**Use Cases**:
- Multiple frontends
- Preview deployments
- Staging environments
- White-labeled versions

**Examples**:
```env
# Allow multiple frontends
FRONTEND_URLS=http://localhost:5173,http://localhost:4173,https://staging.example.com

# Allow preview deployments
FRONTEND_URLS=https://*.vercel.app
```

**Note**: Individual URLs, not wildcards. Use `ALLOW_VERCEL_PREVIEWS` for preview patterns.

### ALLOW_VERCEL_PREVIEWS

**Type**: Boolean (true/false)  
**Required**: No  
**Default**: false  
**Description**: Allow all Vercel preview deployments

**Usage**:
```env
# Allow *.vercel.app
ALLOW_VERCEL_PREVIEWS=true

# Disable preview URLs
ALLOW_VERCEL_PREVIEWS=false
```

**How It Works**:
```javascript
// In CORS middleware
const allowPreviewUrls = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
const isAllowed = 
  configuredFrontendOrigins.includes(origin) ||
  (allowPreviewUrls && origin.endsWith('.vercel.app'));
```

### COOKIE_SECURE

**Type**: Boolean (true/false)  
**Required**: No  
**Default**: false  
**Description**: Enable HTTPS-only cookies

**Values**:
- `true`: Cookie only sent over HTTPS (production)
- `false`: Cookie sent over HTTP or HTTPS (development)

**Examples**:
```env
# Development
COOKIE_SECURE=false

# Production
COOKIE_SECURE=true
```

**Security Note**: Always use `true` in production.

### COOKIE_SAMESITE

**Type**: String  
**Required**: No  
**Default**: lax  
**Valid Values**: `strict`, `lax`, `none`  
**Description**: SameSite attribute for CSRF protection

**Behavior**:
- `strict`: Cookie only sent with same-site requests
- `lax`: Cookie sent with safe cross-site requests
- `none`: Cookie sent with cross-site requests (requires Secure)

**Examples**:
```env
# Development (allow cross-site for testing)
COOKIE_SAMESITE=lax

# Production with Vercel frontend
COOKIE_SAMESITE=none
```

**With ALLOW_VERCEL_PREVIEWS**:
```env
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

## Environment-Specific Configurations

### Local Development

```env
# frontend/codeVault/.env
VITE_BACKEND_URL=http://localhost:3000

# server/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/codevault
JWT_SECRET=dev-secret-key-not-for-production
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

### Staging (Render)

```env
# frontend/codeVault - Vercel
VITE_BACKEND_URL=https://codevault-staging-api.onrender.com

# server - Render
DATABASE_URL=postgresql://user:password@xxx.neon.tech/staging?sslmode=require
JWT_SECRET=staging-long-random-secret-string
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://codevault-staging.vercel.app
ALLOW_VERCEL_PREVIEWS=false
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

### Production (Vercel + Render + Neon)

```env
# frontend/codeVault - Vercel
VITE_BACKEND_URL=https://codevault-api.onrender.com

# server - Render
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.c-3.us-east-1.aws.neon.tech/codevault?sslmode=require&channel_binding=require
JWT_SECRET=production-long-cryptographically-secure-random-secret
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://code-vault-taupe.vercel.app
FRONTEND_URLS=https://code-vault-taupe.vercel.app
ALLOW_VERCEL_PREVIEWS=true
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

## Validation Rules

### Required Field Validation

| Environment | Variable | Status |
|-------------|----------|--------|
| Development | DATABASE_URL | Required |
| Development | JWT_SECRET | Optional |
| Development | FRONTEND_URL | Optional |
| Production | All | Required |

### Format Validation

```javascript
// DATABASE_URL validation
if (!/^postgresql:\/\//.test(DATABASE_URL)) {
  throw new Error('DATABASE_URL must be a PostgreSQL connection string');
}

// JWT_SECRET validation
if (JWT_SECRET && JWT_SECRET.length < 16) {
  console.warn('JWT_SECRET should be at least 16 characters for security');
}

// URL validation
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

## Secrets Management Best Practices

### DON'T

- ❌ Commit `.env` files to Git
- ❌ Share secrets via email or Slack
- ❌ Use same JWT_SECRET across environments
- ❌ Commit `.env.local` or `.env.production`
- ❌ Log secrets to console

### DO

- ✅ Use `.env.example` with placeholder values
- ✅ Store secrets in platform secret managers
- ✅ Rotate JWT_SECRET periodically
- ✅ Use unique secrets per environment
- ✅ Regenerate after team member leaves
- ✅ Audit secret access logs

### Platform-Specific Secret Management

#### Vercel

```bash
# Set secret via CLI
vercel env add VITE_BACKEND_URL

# Or via dashboard: Settings → Environment Variables
```

#### Render

```bash
# Set in dashboard: Environment → Environment Variables
# Encrypted and never displayed after creation
```

#### Railway

```bash
# Set in dashboard: Variables
# Shown during setup, then hidden
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | DATABASE_URL incorrect | Verify host and port |
| SSL error | Missing `sslmode=require` | Add SSL parameter |
| CORS error | Wrong FRONTEND_URL | Check exact domain |
| Token mismatch | Different JWT_SECRET | Ensure consistency |
| Cookie not sent | COOKIE_SECURE=true with HTTP | Use HTTPS in production |

---

**Last Updated**: June 2, 2026  
**Version**: 1.0  
**Next Review**: September 2, 2026
