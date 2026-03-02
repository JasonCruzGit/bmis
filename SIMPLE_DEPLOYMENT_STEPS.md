# Simple Deployment Steps - Follow One by One

## ✅ Step 1: Create New GitHub Repository (5 minutes)

1. Open your browser
2. Go to: https://github.com/new
3. Fill in:
   - **Repository name**: `barangay-system` (or any name you like)
   - **Description**: `Barangay Management System`
   - **Visibility**: Choose Public or Private
   - **IMPORTANT**: Leave everything else UNCHECKED (no README, no .gitignore, no license)
4. Click the green **"Create repository"** button
5. **Copy the repository URL** that appears (it will look like: `https://github.com/YOUR_USERNAME/barangay-system.git`)

---

## ✅ Step 2: Connect Your Code to New Repo (2 minutes)

Open your terminal and run these commands one by one:

```bash
cd /Users/jasoncruz/BIS
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

**Replace** `YOUR_USERNAME` and `REPO_NAME` with your actual GitHub username and the repo name you created in Step 1.

**Example:**
```bash
git remote set-url origin https://github.com/JasonCruzGit/barangay-system.git
git push -u origin main
```

---

## ✅ Step 3: Create Database on Render (5 minutes)

1. Go to: https://dashboard.render.com
2. Sign up or log in
3. Click the big **"New +"** button (top right)
4. Click **"PostgreSQL"**
5. Fill in:
   - **Name**: `bis-database`
   - **Database**: `bis_db`
   - **User**: `bis_user`
   - **Region**: Choose closest to you (e.g., Singapore, US East)
   - **Plan**: Free (for testing)
6. Click **"Create Database"**
7. Wait 2-3 minutes for it to be created
8. Once created, click on the database
9. **Copy the "Internal Database URL"** (looks like: `postgresql://user:password@host:5432/dbname`)
   - Keep this URL safe, you'll need it in Step 4

---

## ✅ Step 4: Deploy Backend on Render (10 minutes)

1. Still on Render dashboard
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** (if you see this)
4. Authorize Render to access GitHub
5. Find and select your **NEW repository** (the one you created in Step 1)
6. Click **"Connect"**

### Configure the Backend:

**Basic Settings:**
- **Name**: `bis-backend`
- **Region**: Same as your database
- **Branch**: `main`
- **Root Directory**: Type `backend` (important!)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables** (click "Add Environment Variable" for each):

1. **NODE_ENV** = `production`
2. **PORT** = `10000`
3. **DATABASE_URL** = (paste the Internal Database URL from Step 3)
4. **JWT_SECRET** = (generate one - see below)
5. **FRONTEND_URL** = `https://placeholder.vercel.app` (we'll update this later)

**To generate JWT_SECRET**, run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as JWT_SECRET value.

7. Click **"Create Web Service"**
8. Wait 5-10 minutes for deployment
9. **Copy your backend URL** (looks like: `https://bis-backend.onrender.com`)

---

## ✅ Step 5: Deploy Frontend on Vercel (10 minutes)

1. Go to: https://vercel.com/new
2. Sign up or log in with GitHub
3. Click **"Import Git Repository"**
4. Find and select your **NEW repository**
5. Click **"Import"**

### Configure the Frontend:

**IMPORTANT**: Before clicking Deploy, click **"Configure Project"** or look for these settings:

- **Root Directory**: Click "Edit" → Type `frontend` → Click "Save"
- **Framework Preset**: Next.js (should be auto-detected)
- **Build Command**: `npm run build` (should be auto)
- **Output Directory**: `.next` (should be auto)

**Environment Variables**:
- Click "Add" or "Environment Variables"
- **Key**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://bis-backend.onrender.com/api` (use your actual backend URL from Step 4)
- Click "Add"

6. Click the big **"Deploy"** button
7. Wait 3-5 minutes
8. **Copy your frontend URL** (looks like: `https://barangay-system.vercel.app`)

---

## ✅ Step 6: Update Backend CORS (2 minutes)

1. Go back to Render dashboard
2. Click on your backend service (`bis-backend`)
3. Go to **"Environment"** tab
4. Find `FRONTEND_URL`
5. Click "Edit"
6. Change the value to your Vercel frontend URL (from Step 5)
7. Click "Save"
8. Render will automatically redeploy (wait 2-3 minutes)

---

## ✅ Step 7: Setup Database (5 minutes)

1. In Render dashboard → Click on your backend service
2. Click **"Shell"** tab (top menu)
3. A terminal will open. Run these commands one by one:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run create-admin
```

4. When creating admin, follow the prompts:
   - Enter email
   - Enter password
   - Confirm password

---

## ✅ Step 8: Test Your Deployment (2 minutes)

1. Open your Vercel frontend URL in a browser
2. You should see the login page
3. Login with the admin credentials you created in Step 7
4. If it works, you're done! 🎉

---

## 🆘 Troubleshooting

**If backend fails to deploy:**
- Check Render logs (click on service → Logs tab)
- Make sure Root Directory is set to `backend`
- Verify all environment variables are set

**If frontend fails to deploy:**
- Check Vercel logs (click on deployment → View Function Logs)
- Make sure Root Directory is set to `frontend`
- Verify `NEXT_PUBLIC_API_URL` is correct

**If you can't login:**
- Make sure database migrations ran (Step 7)
- Make sure admin user was created (Step 7)
- Check backend logs for errors

---

## 📝 Quick Reference

**Your URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://bis-backend.onrender.com`
- Database: (Internal URL from Render)

**Important Settings:**
- Render Backend Root Directory: `backend`
- Vercel Frontend Root Directory: `frontend`
- Backend PORT: `10000`
- Database: PostgreSQL on Render

---

**Need help?** Check the logs in Render and Vercel dashboards for error messages.



