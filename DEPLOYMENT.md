# Deployment Guide

This guide will help you deploy the Barangay Information System to:
- **GitHub**: Code repository
- **Vercel**: Frontend hosting
- **Render**: Backend API and PostgreSQL database

## Prerequisites

1. GitHub account
2. Vercel account (sign up at https://vercel.com)
3. Render account (sign up at https://render.com)

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
cd /Users/jasoncruz/BIS
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `barangay-information-system`)
3. **DO NOT** initialize with README, .gitignore, or license

### 1.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/barangay-information-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Database on Render

### 2.1 Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `bis-database`
   - **Database**: `bis_db`
   - **User**: `bis_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **"Create Database"**
5. Wait for database to be provisioned (2-3 minutes)

### 2.2 Get Database Connection String

1. Once created, click on your database
2. Copy the **"Internal Database URL"** (for backend on Render)
3. Copy the **"External Database URL"** (for local development if needed)

## Step 3: Deploy Backend on Render

### 3.1 Create Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository you just created

### 3.2 Configure Backend Service

**Basic Settings:**
- **Name**: `bis-backend`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
Add the following environment variables:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<Internal Database URL from Step 2.2>
JWT_SECRET=<Generate a strong random string>
FRONTEND_URL=https://your-frontend.vercel.app
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Render will build and deploy your backend
3. Wait for deployment to complete (5-10 minutes)
4. Note your backend URL (e.g., `https://bis-backend.onrender.com`)

## Step 4: Deploy Frontend on Vercel

### 4.1 Import Project

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### 4.2 Configure Frontend

**Project Settings:**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

**Environment Variables:**
Add the following:

```
NEXT_PUBLIC_API_URL=https://bis-backend.onrender.com/api
```

### 4.3 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment (2-5 minutes)
4. Note your frontend URL (e.g., `https://barangay-information-system.vercel.app`)

## Step 5: Update Backend CORS Settings

### 5.1 Update Backend Environment Variable

1. Go back to Render dashboard
2. Navigate to your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

## Step 6: Run Database Migrations

### 6.1 Connect to Render Shell

1. In Render dashboard, go to your backend service
2. Click **"Shell"** tab
3. Run the following commands:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 6.2 Create Admin User

Run the admin creation script:

```bash
npm run create-admin
```

Follow the prompts to create your admin account.

## Step 7: Configure File Uploads

### Option A: Use Render Disk Storage (Temporary)

Files will be stored on Render's disk (may be cleared on redeploy).

### Option B: Use Cloud Storage (Recommended for Production)

For production, configure cloud storage:

1. **AWS S3** or **Cloudinary** for file uploads
2. Update `upload.middleware.ts` to use cloud storage
3. Update environment variables accordingly

## Step 8: Verify Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend API**: Visit `https://your-backend.onrender.com/api/health` (if health endpoint exists)
3. **Login**: Use the admin credentials you created

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] File uploads working
- [ ] Test login functionality
- [ ] Test CRUD operations

## Troubleshooting

### Backend Issues

**Build Fails:**
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node version compatibility

**Database Connection Issues:**
- Verify `DATABASE_URL` is correct
- Check if database is running
- Ensure migrations are deployed

**CORS Errors:**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check backend CORS configuration

### Frontend Issues

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running
- Verify CORS settings

**Build Errors:**
- Check Vercel build logs
- Ensure all dependencies are installed
- Verify Next.js configuration

## Environment Variables Reference

### Backend (Render)

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<Render PostgreSQL URL>
JWT_SECRET=<Strong random string>
FRONTEND_URL=<Vercel frontend URL>
```

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=<Render backend URL>/api
```

## Updating the Deployment

### To update backend:
1. Push changes to GitHub
2. Render will automatically redeploy

### To update frontend:
1. Push changes to GitHub
2. Vercel will automatically redeploy

## Monitoring

- **Render**: Check logs in Render dashboard
- **Vercel**: Check logs in Vercel dashboard
- **Database**: Monitor in Render database dashboard

## Security Notes

1. **Never commit** `.env` files
2. Use strong `JWT_SECRET` in production
3. Enable HTTPS (automatic on Vercel and Render)
4. Regularly update dependencies
5. Use environment variables for all secrets

## Support

For issues:
1. Check deployment logs
2. Verify environment variables
3. Test locally first
4. Check Render/Vercel status pages

