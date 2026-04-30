# Deployment Guide

This project is split into two deployable apps:

- `frontend/codeVault`: React + Vite frontend
- `server`: Express + Prisma backend

You can deploy them independently, which keeps the frontend fast and the backend easier to scale.

## Production Environment Variables

### Frontend

```env
VITE_BACKEND_URL=https://your-api-domain.com
```

### Backend

```env
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
# Optional comma-separated allowlist:
# FRONTEND_URLS=https://preview-1.vercel.app,https://preview-2.vercel.app
# Optional for Vercel previews:
# ALLOW_VERCEL_PREVIEWS=true
```

## Recommended Split

- Vercel for `frontend/codeVault`
- Render or Railway for `server`
- Managed PostgreSQL for the database

## Vercel Frontend

### Project settings

- Import the repository into Vercel
- Set the project root directory to `frontend/codeVault`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Environment variables

- `VITE_BACKEND_URL=https://your-api-domain.com`

### Notes

- If you deploy from a monorepo, create a dedicated Vercel project for the frontend directory
- Preview deployments work well with the backend allowlist when `ALLOW_VERCEL_PREVIEWS=true`

## Render Backend

### Web service settings

- Root directory: `server`
- Runtime: `Node`
- Build command: `npm install && npx prisma generate`
- Start command: `npm run start`
- Pre-deploy command: `npx prisma migrate deploy`

### Environment variables

- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=3000`
- `FRONTEND_URL=https://your-frontend-domain.com`

### Notes

- Render supports monorepos cleanly when `rootDir` is set to `server`
- Run Prisma deploy migrations during pre-deploy so schema changes land before the new release starts serving traffic

## Railway Backend

### Service settings

- Service path / root directory: `server`
- Build command override: `npm install && npx prisma generate`
- Start command override: `npm run start`

### Environment variables

- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `PORT=3000`
- `FRONTEND_URL=https://your-frontend-domain.com`

### Migrations

Run this before or during the first production deploy:

```bash
cd server
npx prisma migrate deploy
```

If you prefer, you can make this part of your Railway release workflow.

## Optional Render Frontend

If you want both services on Render instead of Vercel + Render:

- Create a Static Site
- Root directory: `frontend/codeVault`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_BACKEND_URL=https://your-api-domain.com`

## CI/CD Flow

The repository includes `.github/workflows/ci.yml`.

It validates:

- frontend linting
- frontend production build
- Prisma client generation
- Prisma schema validation
- backend module imports

Recommended release flow:

1. Push a branch or open a pull request
2. Let GitHub Actions pass
3. Merge to `main`
4. Let Vercel and Render/Railway auto-deploy from `main`

## Post-Deploy Checklist

1. Confirm `GET /health` returns a healthy response on the backend
2. Verify browser login sets the secure cookie correctly
3. Create a snippet, then test private, team, and public visibility
4. Join a team with an invite code and confirm shared snippets appear
5. Enable 2FA on a test account and verify login prompts for a code
6. Check that notifications appear after comments or shared snippet updates
