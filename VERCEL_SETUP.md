# Vercel Deployment Setup

## Option 1: Set Root Directory (Recommended)

The Root Directory setting might be in different locations:

### Try These Locations:

1. **Settings → General**
   - Look for "Root Directory" field
   - If not there, try next option

2. **Settings → Build and Deployment**
   - Scroll down to find "Root Directory"
   - Click "Edit"
   - Enter: `frontend`
   - Click "Save"

3. **During Project Import**
   - If you need to re-import:
   - When importing, look for "Root Directory" option
   - Set it to `frontend`

## Option 2: Use vercel.json in Frontend Directory (Already Done)

I've created a `vercel.json` file in the `frontend` directory. Now you need to:

1. **Delete and Re-import the Project** (if Root Directory can't be set):
   - Go to Vercel Dashboard
   - Delete the current project
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - **Important**: When importing, look for "Root Directory" and set it to `frontend`
   - Or manually configure after import

2. **Or Update Existing Project**:
   - Go to Settings → Build and Deployment
   - Look for "Root Directory" 
   - Set to `frontend`

## Option 3: Manual Configuration via Dashboard

1. Go to **Settings → Build and Deployment**
2. Find **"Build Command"** and set to: `npm run build`
3. Find **"Output Directory"** and set to: `.next`
4. Find **"Install Command"** and set to: `npm install`
5. **Root Directory**: Set to `frontend` (if available)

## Environment Variables

Make sure these are set in **Settings → Environment Variables**:
- `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`

## After Configuration

1. Go to **Deployments** tab
2. Click **"Redeploy"** on latest deployment
3. Or push a new commit to trigger auto-deploy

