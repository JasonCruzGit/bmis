# Vercel Deployment Setup

## Important: Configure Root Directory

Vercel needs to know that the frontend code is in the `frontend` subdirectory.

### Steps to Fix:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Open Project Settings**
   - Click on **"Settings"** tab
   - Scroll to **"General"** section

3. **Set Root Directory**
   - Find **"Root Directory"** option
   - Click **"Edit"**
   - Enter: `frontend`
   - Click **"Save"**

4. **Redeploy**
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger auto-deploy

## Alternative: If Root Directory Setting Doesn't Work

If you can't set the root directory, you can create a `vercel.json` in the `frontend` directory instead:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

Then set Root Directory to `frontend` in Vercel dashboard.

## Environment Variables

Make sure these are set in Vercel:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`

