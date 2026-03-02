# Run Database Migrations on Render

## Quick Fix: Use Render Shell

Since there's no "Post Deploy Command" option, use the Shell:

### Step 1: Open Shell
1. Go to Render Dashboard → Your backend service (`bdss-backend`)
2. Click **"Shell"** tab (top menu)
3. A terminal will open

### Step 2: Run These Commands

Copy and paste these commands **one by one**:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run create-admin
```

### Step 3: Follow Prompts
When you run `npm run create-admin`, it will ask:
- Email address
- Password
- Confirm password

Enter your admin credentials.

### Step 4: Check Logs
1. Go to **"Logs"** tab
2. Refresh the page
3. The error should be gone!

---

## Alternative: Update Start Command (Optional)

If you want migrations to run automatically on every deploy:

1. Go to **Settings** → **Build & Deploy**
2. Find **"Start Command"**
3. Change it to:
   ```
   cd backend && npx prisma migrate deploy && npx prisma generate && npm start
   ```
4. Click **"Save Changes"**
5. Render will redeploy

**Note:** This will run migrations on every deploy, which is safe but adds a few seconds to startup time.

---

## Current Start Command

Your current start command is:
```
npm start
```

Which runs:
```
prisma generate && prisma migrate deploy && node dist/server.js
```

This should work, but if migrations are failing, run them manually via Shell first.



