# Render Database Setup - Run Migrations

## The Error
Your backend is deployed but showing this error:
```
The column 'users.barangay' does not exist in the current database.
```

This means the database migrations haven't been run yet.

## Solution: Run Database Migrations

### Step 1: Open Render Shell

1. Go to Render Dashboard: https://dashboard.render.com
2. Click on your backend service (`bdss-backend`)
3. Click the **"Shell"** tab (top menu)

### Step 2: Run Migrations

In the Shell terminal, run these commands **one by one**:

```bash
cd backend
npx prisma migrate deploy
```

This will apply all pending migrations to your database.

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Create Admin User

```bash
npm run create-admin
```

Follow the prompts:
- Enter email address
- Enter password
- Confirm password

### Step 5: Verify

1. Go back to the **"Logs"** tab
2. The error should be gone
3. Your backend should be working properly

## Alternative: If Shell Doesn't Work

If the Shell tab doesn't work, you can also run migrations by:

1. **Settings** → **Build & Deploy**
2. Add a **"Post Deploy Command"**:
   ```
   cd backend && npx prisma migrate deploy && npx prisma generate
   ```
3. Click **"Save Changes"**
4. Render will redeploy and run migrations automatically

## After Migrations Complete

Your backend should be fully functional! You can then:
1. Test the API endpoints
2. Deploy the frontend on Vercel
3. Connect frontend to backend



