# 🚂 Railway Deployment Guide for V-Fix Web App

Complete step-by-step guide to deploy your V-Fix Web App to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitLab Repository**: Your code should be in GitLab (already done ✅)
3. **Supabase Database**: You already have this set up ✅

---

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"**
3. Select **"Deploy from Git repo"**
4. Connect your GitLab account (if not already connected)
5. Select your repository: `group04/v-fix-web-app`
6. Select branch: `pınar` (or `main` if you prefer)
7. Click **"Deploy Now"**

---

## Step 2: Add PostgreSQL Database (Supabase)

Since you're using Supabase, you have two options:

### Option A: Use Supabase (Recommended - You already have this)
- Keep using your existing Supabase database
- No need to add Railway PostgreSQL

### Option B: Use Railway PostgreSQL
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will create a PostgreSQL database
4. Copy the `DATABASE_URL` from the database service variables

---

## Step 3: Deploy Backend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (or GitLab if available)
3. Select your repository again
4. Railway will detect it's a monorepo
5. **Configure the service:**
   - **Name**: `v-fix-backend` (or any name you prefer)
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (Railway will auto-detect)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Backend Environment Variables

Go to your backend service → **Variables** tab and add:

```bash
# Database (use your Supabase connection string)
DATABASE_URL=postgresql://postgres.bbpfikbtosigehxahloy:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require

# Encryption Key (generate a new one or use existing)
ENCRYPTION_KEY=xNibdvn0Lu8NNoiys_u3S1vo9s-155-SCUg0dn8Eia0=

# Optional: JWT Secret (if you have one)
JWT_SECRET_KEY=your-secret-key-here

# Environment
ENVIRONMENT=production
```

**To generate a new ENCRYPTION_KEY:**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

---

## Step 4: Deploy Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** (same repository)
3. **Configure the service:**
   - **Name**: `v-fix-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### Frontend Environment Variables

Go to your frontend service → **Variables** tab and add:

```bash
# Backend API URL (use your backend service URL)
VITE_API_URL=https://your-backend-service.railway.app/api
```

**Important**: Replace `your-backend-service.railway.app` with your actual backend Railway URL.

---

## Step 5: Generate Public URLs

### Backend:
1. Go to your backend service
2. Click **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the generated URL (e.g., `v-fix-backend.railway.app`)

### Frontend:
1. Go to your frontend service
2. Click **"Settings"** tab
3. Scroll to **"Networking"**
4. Click **"Generate Domain"**
5. Copy the generated URL (e.g., `v-fix-frontend.railway.app`)

---

## Step 6: Update Frontend Environment Variable

1. Go back to your **frontend service** → **Variables**
2. Update `VITE_API_URL`:
   ```bash
   VITE_API_URL=https://v-fix-backend.railway.app/api
   ```
   (Replace with your actual backend URL)
3. Railway will automatically redeploy the frontend

---

## Step 7: Configure CORS (Backend)

Your backend needs to allow requests from your frontend domain.

1. Go to **backend service** → **Variables**
2. Add (if not already set):
   ```bash
   CORS_ORIGINS=https://v-fix-frontend.railway.app,https://your-frontend-url.railway.app
   ```

Or check your `backend/app/main.py` - it should already allow all origins in production.

---

## Step 8: Verify Deployment

1. **Backend Health Check:**
   - Visit: `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"ok",...}`

2. **Backend API Docs:**
   - Visit: `https://your-backend.railway.app/api/docs`
   - Should show Swagger UI

3. **Frontend:**
   - Visit: `https://your-frontend.railway.app`
   - Should load your React app

---

## Step 9: Test the Application

1. Open your frontend URL
2. Try to register a new user
3. Try to login
4. Test the chat functionality
5. Check if data is being saved to Supabase

---

## Troubleshooting

### Backend won't start:
- Check logs: Go to service → **"Deployments"** → Click latest deployment → **"View Logs"**
- Common issues:
  - Missing `DATABASE_URL` → Add it in Variables
  - Missing `ENCRYPTION_KEY` → Generate and add it
  - Port binding error → Make sure using `$PORT` in start command

### Frontend can't connect to backend:
- Check `VITE_API_URL` is set correctly
- Check backend CORS settings
- Check backend is running (visit `/api/health`)

### Database connection errors:
- Verify `DATABASE_URL` is correct
- Check Supabase connection string includes `?sslmode=require`
- Verify Supabase allows connections from Railway IPs (check Network Restrictions)

### Build fails:
- Check Railway logs for specific error
- Common issues:
  - Missing dependencies → Check `requirements.txt` or `package.json`
  - Build timeout → Increase build timeout in settings
  - Memory issues → Upgrade Railway plan

---

## Environment Variables Summary

### Backend Required:
- ✅ `DATABASE_URL` - Supabase PostgreSQL connection string
- ✅ `ENCRYPTION_KEY` - Fernet encryption key
- ⚠️ `JWT_SECRET_KEY` - If using custom JWT secrets
- ⚠️ `CORS_ORIGINS` - If you want to restrict CORS

### Frontend Required:
- ✅ `VITE_API_URL` - Backend API URL (must start with `https://`)

---

## Quick Deploy Checklist

- [ ] Railway project created
- [ ] Backend service added with root directory `backend`
- [ ] Frontend service added with root directory `frontend`
- [ ] Backend environment variables set (DATABASE_URL, ENCRYPTION_KEY)
- [ ] Frontend environment variable set (VITE_API_URL)
- [ ] Backend domain generated
- [ ] Frontend domain generated
- [ ] VITE_API_URL updated with backend URL
- [ ] Both services deployed successfully
- [ ] Health check passes
- [ ] Frontend loads correctly
- [ ] Can register/login
- [ ] Chat works

---

## Next Steps After Deployment

1. **Set up custom domains** (optional):
   - Go to service → Settings → Networking → Custom Domain
   - Add your domain and configure DNS

2. **Set up monitoring**:
   - Railway provides basic metrics
   - Consider adding Sentry for error tracking

3. **Backup strategy**:
   - Supabase has automatic backups
   - Consider setting up additional backups

4. **CI/CD** (already configured):
   - Your `.gitlab-ci.yml` can deploy to Railway
   - Or use Railway's automatic deployments on git push

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your project: Check Railway dashboard for logs and metrics

---

**🎉 Congratulations! Your V-Fix Web App is now deployed to Railway!**

