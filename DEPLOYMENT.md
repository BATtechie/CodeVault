# Deployment Guide

## Backend (Render) Setup

### 1. Environment Variables on Render

In your Render dashboard, go to your backend service → Environment → Add the following:

```
DATABASE_URL=postgresql://neondb_owner:npg_o1bpl0RzvCaw@ep-misty-queen-ahgfcx7j-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_secret_key_here
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend.vercel.app
```

**Important:** Replace `https://your-frontend.vercel.app` with your actual Vercel frontend URL.

### 2. Get Your Render Backend URL

After deploying on Render, you'll get a URL like:
- `https://your-app-name.onrender.com`

Copy this URL - you'll need it for the frontend.

---

## Frontend (Vercel) Setup

### 1. Environment Variables on Vercel

In your Vercel dashboard, go to your project → Settings → Environment Variables → Add:

```
VITE_BACKEND_URL=https://your-app-name.onrender.com
```

**Important:** Replace `https://your-app-name.onrender.com` with your actual Render backend URL.

### 2. Update the Code

After setting the environment variable, you need to:

1. **Update the fallback URL in the code** (temporary until Vercel picks up the env var):
   - In `frontend/codeVault/src/pages/SignIn.jsx`, replace `'https://your-backend.onrender.com'` with your actual Render URL
   - In `frontend/codeVault/src/pages/Home.jsx`, replace `'https://your-backend.onrender.com'` with your actual Render URL

2. **Redeploy on Vercel** after setting the environment variable

---

## Quick Fix for Current Issue

If you're seeing "Server unreachable" right now, do this:

1. **Get your Render backend URL** (e.g., `https://codevault-backend.onrender.com`)

2. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `VITE_BACKEND_URL` = `https://your-actual-render-url.onrender.com`
   - Make sure to select "Production", "Preview", and "Development" environments

3. **Update Render CORS:**
   - Go to Render Dashboard → Your Backend Service → Environment Variables
   - Add/Update: `FRONTEND_URL` = `https://your-actual-vercel-url.vercel.app`
   - Redeploy the backend

4. **Redeploy both:**
   - Vercel will auto-redeploy when you push changes
   - Render may need a manual redeploy after env var changes

---

## Testing

After deployment:

1. **Test locally:**
   ```bash
   # Frontend
   cd frontend/codeVault
   npm run dev
   
   # Backend (if testing locally)
   cd server
   npm run dev
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for "Backend URL:" in console logs
   - Should show your Render URL in production

3. **Test the connection:**
   - Try signing up with a new account
   - Check Network tab for failed requests
   - Verify CORS headers in response

---

## Troubleshooting

### "Server unreachable" Error

1. **Check environment variables are set correctly:**
   - Vercel: `VITE_BACKEND_URL` should be your Render URL
   - Render: `FRONTEND_URL` should be your Vercel URL

2. **Verify CORS is configured:**
   - Backend CORS should allow your Vercel domain
   - Check browser console for CORS errors

3. **Check Render service is running:**
   - Render services sleep after inactivity
   - First request may take 30-60 seconds to wake up

4. **Verify URLs are correct:**
   - No trailing slashes
   - HTTPS (not HTTP) for production
   - No typos in domain names

### CORS Errors

If you see CORS errors in the browser console:

1. Update `FRONTEND_URL` in Render environment variables
2. Redeploy the backend service
3. Clear browser cache and cookies

### Database Connection Issues

If backend can't connect to database:

1. Verify `DATABASE_URL` is set correctly in Render
2. Check database is accessible (Neon PostgreSQL should be accessible)
3. Run migrations: `npx prisma migrate deploy` (if needed)

---

## Local Development

For local development, create `.env` files:

**Frontend** (`frontend/codeVault/.env`):
```
VITE_BACKEND_URL=http://localhost:3000
```

**Backend** (`server/.env`):
```
DATABASE_URL=postgresql://neondb_owner:npg_o1bpl0RzvCaw@ep-misty-queen-ahgfcx7j-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```




