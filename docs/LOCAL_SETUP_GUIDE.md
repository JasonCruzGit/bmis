# Local Setup Guide - Barangay Management Information System

## Quick Start Guide

This guide will help you set up and run the Barangay Management Information System on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (version 14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git** (optional, if cloning from repository)

### Verify Installation

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
psql --version    # Should show PostgreSQL 14.x or higher
```

---

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd /Users/jasoncruz/BIS
```

### 2. Install Dependencies

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Set Up PostgreSQL Database

#### Create Database
Open PostgreSQL (using `psql` command line or pgAdmin):

```sql
CREATE DATABASE bis_db;
```

Or using command line:
```bash
createdb bis_db
```

### 4. Configure Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd ../backend
touch .env
```

Add the following content to `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bis_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**Important:** 
- Replace `username` and `password` with your PostgreSQL credentials
- Replace `your-super-secret-jwt-key-change-this-in-production` with a secure random string
- If your PostgreSQL uses a different port, update `5432` accordingly

### 5. Configure Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cd ../frontend
touch .env.local
```

Add the following content to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 6. Set Up Database Schema

Run Prisma migrations to create all database tables:

```bash
cd ../backend
npx prisma migrate dev
npx prisma generate
```

This will:
- Create all database tables based on the schema
- Generate the Prisma Client for database operations

### 7. Create Admin User

The system automatically creates/resets an admin user on server startup. The default credentials are:

- **Email:** `admin@barangay.gov.ph`
- **Password:** `p@ssword123`

Alternatively, you can create an admin user manually using the script:

```bash
cd backend
npm run create-admin
```

Or use Prisma Studio to create a user:

```bash
npx prisma studio
```

Then navigate to the `User` table and create a new user with:
- Email: `admin@barangay.gov.ph`
- Password: (hashed using bcrypt)
- Role: `ADMIN`
- isActive: `true`

---

## Running the Application

### Start Backend Server

Open a terminal and run:

```bash
cd /Users/jasoncruz/BIS/backend
npm run dev
```

The backend server will start on **http://localhost:5000**

You should see:
```
Server running on port 5000
✅ Admin password reset: admin@barangay.gov.ph
```

### Start Frontend Server

Open a **new terminal** and run:

```bash
cd /Users/jasoncruz/BIS/frontend
npm run dev
```

The frontend server will start on **http://localhost:3000**

You should see:
```
- ready started server on 0.0.0.0:3000
- Local: http://localhost:3000
```

---

## Accessing the System

### Admin Portal

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You'll be redirected to the login page
4. Use the admin credentials:
   - **Email:** `admin@barangay.gov.ph`
   - **Password:** `p@ssword123`

### Resident Portal

1. Navigate to: **http://localhost:3000/portal**
2. Residents can log in using their contact number and date of birth (first time) or password (subsequent logins)

### API Endpoints

The backend API is available at: **http://localhost:5000/api**

Test the API:
```bash
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

**For Frontend (port 3000):**
```bash
cd frontend
PORT=3001 npm run dev
```
Then update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**For Backend (port 5000):**
```bash
cd backend
PORT=5001 npm run dev
```
Then update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Database Connection Error

1. **Check PostgreSQL is running:**
   ```bash
   # macOS
   brew services list
   # or
   pg_ctl status
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **Verify DATABASE_URL format:**
   ```
   postgresql://username:password@localhost:5432/bis_db
   ```

3. **Test connection:**
   ```bash
   psql -U username -d bis_db
   ```

### Prisma Issues

**Reset database (development only):**
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

**Regenerate Prisma Client:**
```bash
cd backend
npx prisma generate
```

### Module Not Found Errors

**Clear cache and reinstall:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

### CORS Errors

If you see CORS errors, ensure:
1. Backend `.env` has: `FRONTEND_URL="http://localhost:3000"`
2. Frontend `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
3. Both servers are running

---

## Development Commands

### Backend Commands

```bash
cd backend

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create admin user
npm run create-admin

# Reset admin password
npm run reset-admin
```

### Frontend Commands

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linter
npm run lint
```

---

## Project Structure

```
BIS/
├── backend/              # Express backend API
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, upload middleware
│   │   ├── utils/         # Utilities (PDF, QR codes)
│   │   └── server.ts      # Main server file
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── uploads/           # File uploads directory
│   ├── .env              # Environment variables (create this)
│   └── package.json
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   ├── .env.local        # Environment variables (create this)
│   └── package.json
└── docs/                 # Documentation
```

---

## Next Steps

1. **Explore the Admin Dashboard:**
   - Navigate to http://localhost:3000 after logging in
   - Check out the dashboard with statistics and charts

2. **Test Features:**
   - Create a resident
   - Generate a document
   - Create an announcement
   - Test other modules

3. **View Database:**
   ```bash
   cd backend
   npx prisma studio
   ```
   This opens a web interface to view and edit database records

4. **Check API Documentation:**
   - See `docs/API.md` for API endpoint documentation

---

## Quick Reference

| Service | URL | Default Port |
|---------|-----|--------------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5000/api | 5000 |
| Prisma Studio | http://localhost:5555 | 5555 |

| Default Admin Credentials |
|--------------------------|
| Email: `admin@barangay.gov.ph` |
| Password: `p@ssword123` |

---

## Need Help?

- Check the main `README.md` file
- Review `SETUP.md` for detailed setup instructions
- See `docs/` directory for additional documentation
- Check console logs for error messages

---

**Happy Coding! 🚀**




