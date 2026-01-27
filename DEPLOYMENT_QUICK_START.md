# Quick Deployment Guide

## 🚀 Deploy in 5 Steps

### Step 1: Push to GitHub
```bash
cd /Users/jasoncruz/BIS
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/barangay-information-system.git
git push -u origin main
```

### Step 2: Create Database on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Name: `bis-database`
4. Click **"Create Database"**
5. Copy the **Internal Database URL**

### Step 3: Deploy Backend on Render
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - **Name**: `bis-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<Internal Database URL>
   JWT_SECRET=<Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   FRONTEND_URL=<Will update after Vercel deploy>
   ```
5. Click **"Create Web Service"**
6. Note your backend URL (e.g., `https://bis-backend.onrender.com`)

### Step 4: Deploy Frontend on Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework**: Next.js (auto-detected)
4. Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://bis-backend.onrender.com/api
   ```
5. Click **"Deploy"**
6. Note your frontend URL (e.g., `https://barangay-info.vercel.app`)

### Step 5: Update Backend CORS
1. Go back to Render → Your backend service
2. Update `FRONTEND_URL` environment variable:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
3. Save (auto-redeploys)

### Step 6: Run Migrations & Create Admin
1. In Render → Backend → Shell tab:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run create-admin
   ```

### ✅ Done!
Visit your Vercel URL and login with admin credentials!

