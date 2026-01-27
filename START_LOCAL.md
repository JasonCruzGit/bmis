# Quick Start Guide - Run BIS Locally

## Step 1: Start Backend Server

Open **Terminal 1** and run:

```bash
cd /Users/jasoncruz/BIS/backend
npm run dev
```

**Expected output:**
```
Server running on port 5000
✅ Admin password reset: admin@barangay.gov.ph
```

✅ Backend is running on: **http://localhost:5000**

---

## Step 2: Start Frontend Server

Open **Terminal 2** (new terminal window) and run:

```bash
cd /Users/jasoncruz/BIS/frontend
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
- Local:        http://localhost:3000
```

✅ Frontend is running on: **http://localhost:3000**

---

## Step 3: Access the System

1. Open your web browser
2. Go to: **http://localhost:3000**
3. You should see the login page

**Login Credentials:**
- **Email:** `admin@barangay.gov.ph`
- **Password:** `p@ssword123`

---

## Troubleshooting

### Port 3000 Already in Use

If you see "Port 3000 is already in use":

**Option 1: Kill the process using port 3000**
```bash
lsof -ti:3000 | xargs kill -9
```

**Option 2: Use a different port**
```bash
cd frontend
PORT=3001 npm run dev
```
Then access: http://localhost:3001

### Port 5000 Already in Use

If backend port 5000 is in use:

**Option 1: Kill the process**
```bash
lsof -ti:5000 | xargs kill -9
```

**Option 2: Use a different port**
```bash
cd backend
PORT=5001 npm run dev
```
Then update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Backend Not Starting

1. **Check if PostgreSQL is running:**
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Or check if you can connect
   psql -U your_username -d bis_db
   ```

2. **Check environment variables:**
   Make sure `backend/.env` exists and has:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/bis_db"
   JWT_SECRET="your-secret-key"
   PORT=5000
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Run database migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

### Frontend Not Starting

1. **Check environment variables:**
   Make sure `frontend/.env.local` exists and has:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. **Clear Next.js cache:**
   ```bash
   cd frontend
   rm -rf .next
   npm run dev
   ```

3. **Reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Database Connection Error

1. **Verify PostgreSQL is installed and running**
2. **Check DATABASE_URL format:**
   ```
   postgresql://username:password@localhost:5432/bis_db
   ```
3. **Create the database if it doesn't exist:**
   ```sql
   CREATE DATABASE bis_db;
   ```

---

## Quick Commands Reference

### Stop All Servers
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### Check What's Running
```bash
# Check port 3000
lsof -i :3000

# Check port 5000
lsof -i :5000
```

### View Backend Logs
The backend logs will show in Terminal 1 where you ran `npm run dev`

### View Frontend Logs
The frontend logs will show in Terminal 2 where you ran `npm run dev`

---

## Success Indicators

✅ **Backend is working if:**
- Terminal shows: "Server running on port 5000"
- You can access: http://localhost:5000/api (should show JSON or error, not 404)

✅ **Frontend is working if:**
- Terminal shows: "ready started server on 0.0.0.0:3000"
- Browser shows the login page at http://localhost:3000
- No console errors in browser

---

## Need More Help?

See the detailed guide: `docs/LOCAL_SETUP_GUIDE.md`




