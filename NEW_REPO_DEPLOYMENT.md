# Deploy to New GitHub Repository

## Step 1: Create New GitHub Repository

1. Go to https://github.com/new
2. Repository name: `barangay-information-system` (or your preferred name)
3. Description: "Comprehensive Barangay Management Information System"
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **"Create repository"**

## Step 2: Update Git Remote

After creating the new repo, GitHub will show you the repository URL. Use one of these commands:

### If you want to replace the current remote:

```bash
cd /Users/jasoncruz/BIS
git remote set-url origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u origin main
```

### Or add a new remote:

```bash
cd /Users/jasoncruz/BIS
git remote add new-origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git
git push -u new-origin main
```

## Step 3: Deploy Backend on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** (if not already connected)
4. Select your **NEW** repository
5. Configure:
   - **Name**: `bis-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
6. Create PostgreSQL database first (if not done):
   - **New +** → **PostgreSQL**
   - Name: `bis-database`
   - Copy the **Internal Database URL**
7. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<Internal Database URL>
   JWT_SECRET=<Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   FRONTEND_URL=<Will update after Vercel>
   ```
8. Click **"Create Web Service"**
9. Note your backend URL (e.g., `https://bis-backend.onrender.com`)

## Step 4: Deploy Frontend on Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your **NEW** GitHub repository
4. Click **"Import"**
5. **IMPORTANT**: In the configuration screen:
   - **Root Directory**: Click "Edit" and set to `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
6. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://bis-backend.onrender.com/api
   ```
   (Use your actual Render backend URL)
7. Click **"Deploy"**
8. Note your frontend URL (e.g., `https://barangay-info.vercel.app`)

## Step 5: Update Backend CORS

1. Go back to Render dashboard
2. Navigate to your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Click **"Save Changes"** (auto-redeploys)

## Step 6: Run Database Migrations

1. In Render dashboard → Backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   npm run create-admin
   ```

## Step 7: Verify Deployment

1. Visit your Vercel frontend URL
2. Login with admin credentials
3. Test the system

## Quick Commands Reference

```bash
# Change remote to new repo
git remote set-url origin https://github.com/YOUR_USERNAME/NEW_REPO_NAME.git

# Push to new repo
git push -u origin main

# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

