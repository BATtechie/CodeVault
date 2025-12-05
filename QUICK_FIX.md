# Quick Fix: Server Unreachable Error

## Step 1: Get Your URLs

1. **Render Backend URL:** 
   - Go to Render dashboard → Your backend service
   - Copy the URL (e.g., `https://codevault-api.onrender.com`)

2. **Vercel Frontend URL:**
   - Go to Vercel dashboard → Your frontend project
   - Copy the URL (e.g., `https://codevault.vercel.app`)

## Step 2: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://your-actual-render-url.onrender.com` (replace with your Render URL)
   - **Environment:** Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project (or push a new commit)

## Step 3: Update Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update:
   - **Key:** `FRONTEND_URL`
   - **Value:** `https://your-actual-vercel-url.vercel.app` (replace with your Vercel URL)
5. Click **Save Changes**
6. **Redeploy** your service (click "Manual Deploy" → "Deploy latest commit")

## Step 4: Update Code (Temporary Fallback)

Until Vercel picks up the environment variable, update these files:

**File:** `frontend/codeVault/src/pages/SignIn.jsx`
- Line 45: Replace `'https://your-backend.onrender.com'` with your actual Render URL
- Line 93: Replace `'https://your-backend.onrender.com'` with your actual Render URL

**File:** `frontend/codeVault/src/pages/Home.jsx`
- Line 13: Replace `'https://your-backend.onrender.com'` with your actual Render URL

## Step 5: Test

1. Clear browser cache and cookies
2. Open your Vercel site
3. Open browser DevTools (F12) → Console tab
4. Try to sign up/login
5. Check console for "Backend URL:" - it should show your Render URL
6. Check Network tab for any failed requests

## Common Issues

### Still seeing "Server unreachable"?

1. **Check Render service is awake:**
   - Free tier services sleep after 15 minutes of inactivity
   - First request may take 30-60 seconds
   - Visit your Render URL directly to wake it up

2. **Verify environment variables:**
   - Vercel: Settings → Environment Variables → Check `VITE_BACKEND_URL` exists
   - Render: Environment tab → Check `FRONTEND_URL` exists

3. **Check CORS:**
   - Browser console should not show CORS errors
   - If you see CORS errors, verify `FRONTEND_URL` in Render matches your Vercel URL exactly

4. **Check URLs:**
   - No trailing slashes
   - Use HTTPS (not HTTP)
   - No typos

### Render service keeps sleeping?

Consider upgrading to a paid plan, or use a service like UptimeRobot to ping your Render service every 5 minutes to keep it awake.




