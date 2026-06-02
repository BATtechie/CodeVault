# Production Deployment Guide for CodeVault

This guide provides step-by-step instructions for deploying CodeVault to production across Vercel (frontend), Render/Railway (backend), and Neon PostgreSQL (database).

## Architecture Overview

```
┌─────────────────┐
│  Frontend App   │
│    (Vercel)     │
│ React + Vite    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐      ┌──────────────┐
│  Backend API    │─────▶│  PostgreSQL  │
│  (Render/Rail)  │      │  (Neon)      │
│  Express        │      └──────────────┘
└─────────────────┘
```

## Prerequisites

- Node.js 20+
- npm
- Accounts on: Vercel, Render (or Railway), Neon
- GitHub repository access
- Domain names (optional but recommended)

## Part 1: Database Setup (Neon PostgreSQL)

### 1.1 Create Neon Project

1. Log in to [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Select PostgreSQL version (14 or later recommended)
4. Copy the connection string in the format:
   ```
   postgresql://user:password@host:port/database?sslmode=require&channel_binding=require
   ```
5. Save this for the backend environment setup

### 1.2 Verify Database Connection

```bash
# Test connection from your local machine
psql postgresql://user:password@host:port/database
```

### 1.3 Apply Migrations

Migrations will be automatically applied during deployment (pre-deploy script).

## Part 2: Backend Deployment (Render or Railway)

### Option A: Deploy to Render

#### 2A.1 Create Web Service

1. Log in to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `codevault-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm run start`

#### 2A.2 Set Environment Variables

In Render dashboard, set the following environment variables:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require&channel_binding=require
JWT_SECRET=your-long-random-secret-key-change-this
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
FRONTEND_URLS=https://your-frontend-domain.com,https://*.vercel.app
ALLOW_VERCEL_PREVIEWS=true
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

#### 2A.3 Configure Pre-Deploy Hook

Add to Render service settings:
```
Pre-deploy command: npx prisma migrate deploy
```

#### 2A.4 Deploy

1. Click "Deploy" on Render dashboard
2. Monitor build logs
3. Verify health check at `https://your-backend-url/health`

### Option B: Deploy to Railway

#### 2B.1 Create Service

1. Log in to [railway.app](https://railway.app)
2. Create new project from GitHub
3. Select the CodeVault repository
4. Configure service:
   - **Root directory**: `server`
   - **Build command**: `npm install && npx prisma generate`
   - **Start command**: `npm run start`

#### 2B.2 Set Environment Variables

In Railway dashboard, configure the same environment variables as Render.

#### 2B.3 Deploy

Railway automatically deploys on push to main branch.

## Part 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Project

1. Log in to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Configure project:
   - **Framework**: Vite
   - **Root Directory**: `frontend/codeVault`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Set Environment Variables

In Vercel dashboard, set:

```env
VITE_BACKEND_URL=https://your-backend-url.com
```

### 3.3 Configure Domains

1. Add your domain in Vercel project settings
2. Follow Vercel's domain setup instructions
3. Configure DNS records

### 3.4 Deploy

1. Vercel automatically deploys on push to main branch
2. Preview deployments created for pull requests
3. Production deployment at main branch commits

## Part 4: Post-Deployment Verification

### 4.1 Backend Health Checks

```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Expected response:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "timestamp": "2026-06-02T...",
#     "database": "healthy"
#   }
# }
```

### 4.2 Frontend Verification

1. Visit your frontend URL
2. Verify page loads without errors
3. Check browser console for errors
4. Test signup/login flow
5. Create a snippet
6. Join a team

### 4.3 API Testing

```bash
# Test signup
curl -X POST https://your-backend-url.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

# Test login
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### 4.4 CORS Verification

1. Open browser DevTools
2. Go to frontend app
3. Try creating a snippet
4. Verify no CORS errors
5. Check that Authorization header is sent

## Part 5: Continuous Integration/Deployment

### 5.1 GitHub Actions Workflow

The project includes `.github/workflows/ci.yml` which:

1. **Frontend**:
   - Runs ESLint
   - Builds Vite project
   - Checks for TypeErrors

2. **Backend**:
   - Validates Prisma schema
   - Checks imports
   - Validates database connection

### 5.2 Deployment Triggers

- **Vercel**: Automatic on main branch push
- **Render/Railway**: Automatic on main branch push
- **Database**: Run migrations on backend pre-deploy

### 5.3 Preview Deployments

- Vercel creates preview deployments for pull requests
- Backend uses `ALLOW_VERCEL_PREVIEWS=true` to allow preview frontend URLs

## Part 6: Environment Variables Reference

### Frontend (.env)

```env
VITE_BACKEND_URL=https://codevault-api.onrender.com
```

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host/db?sslmode=require

# Security
JWT_SECRET=your-secret-key-32-chars-minimum
NODE_ENV=production
PORT=3000

# CORS
FRONTEND_URL=https://code-vault-taupe.vercel.app
FRONTEND_URLS=https://code-vault-taupe.vercel.app,https://*.vercel.app

# Feature Flags
ALLOW_VERCEL_PREVIEWS=true

# Cookie Security
COOKIE_SECURE=true
COOKIE_SAMESITE=none
```

## Part 7: Troubleshooting

### Database Connection Issues

**Error**: `P1000: Authentication failed`
- **Solution**: Check DATABASE_URL format and credentials

**Error**: `SSL connection error`
- **Solution**: Ensure `sslmode=require` is in DATABASE_URL

### CORS Errors

**Error**: `Access-Control-Allow-Origin` header missing
- **Solution**: Verify FRONTEND_URL and FRONTEND_URLS are correct

### Build Failures

**Frontend build fails**:
1. Check npm audit for vulnerabilities
2. Run `npm ci` to install exact versions
3. Verify Node.js version is 20+

**Backend build fails**:
1. Verify DATABASE_URL is set
2. Run `npx prisma migrate deploy`
3. Check Prisma schema for errors

## Part 8: Monitoring & Logging

### Backend Monitoring

1. **Render Dashboard**: View logs in real-time
2. **Health Endpoint**: Check at `/health`
3. **Error Logs**: Available in service logs

### Frontend Monitoring

1. **Vercel Analytics**: Track performance
2. **Browser Console**: Check for client-side errors
3. **Network Tab**: Monitor API calls

### Recommended Additions

- **Sentry**: Error tracking
- **LogRocket**: Session recording
- **Datadog**: Infrastructure monitoring
- **PagerDuty**: Incident alerting

## Part 9: Scaling Considerations

### Database Scaling

- Neon auto-scales compute
- Monitor connection pool usage
- Consider read replicas for high traffic

### Backend Scaling

- Render: Scale up with more power
- Railway: Auto-scale with resource requests
- Load balancing: Use CDN or reverse proxy

### Frontend Scaling

- Vercel: Globally distributed
- Edge functions: For request transformation
- ISR: Incremental Static Regeneration for public snippets

## Part 10: Security Checklist

- [ ] JWT_SECRET is unique and secure
- [ ] DATABASE_URL uses SSL connection
- [ ] CORS allows only frontend domains
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Helmet headers enabled
- [ ] HTTPS enforced
- [ ] Sensitive data not in commits
- [ ] `.env` files in `.gitignore`
- [ ] Regular security audits scheduled

## Part 11: Rollback Procedure

### Render/Railway Rollback

1. Go to deployment history
2. Click "Rollback"
3. Select previous working version
4. Confirm rollback

### Database Rollback

1. Create backup before major changes
2. Use Prisma migrations to rollback schema
3. Check data integrity

### Frontend Rollback

1. Go to Vercel deployments
2. Click "..." on previous version
3. Select "Promote to Production"

## Part 12: Maintenance Tasks

### Weekly

- Monitor health endpoint
- Check error logs
- Review CSRF token generation

### Monthly

- Run `npm audit` and update
- Review performance metrics
- Check database size

### Quarterly

- Security assessment
- Load testing
- Disaster recovery drill

## Support & Debugging

For issues or questions:

1. Check logs in deployment dashboard
2. Review `.env` variables
3. Verify database connection
4. Test health endpoints
5. Check GitHub Actions CI logs

---

**Last Updated**: June 2, 2026  
**Version**: 1.0  
**Maintained By**: CodeVault Team
