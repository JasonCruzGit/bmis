# Barangay Management Information System - Setup Guide

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd BIS
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE bis_db;
   ```

6. **Configure backend environment**
   ```bash
   cd ../backend
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A secure random string
   - `FRONTEND_URL` - http://localhost:3000

7. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

8. **Configure frontend environment**
   ```bash
   cd ../frontend
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_API_URL` - http://localhost:5000/api

9. **Start development servers**

   In one terminal (backend):
   ```bash
   cd backend
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd frontend
   npm run dev
   ```

10. **Access the application**
    - Frontend: http://localhost:3000
    - Backend API: http://localhost:5000/api

## Creating the First Admin User

You can create an admin user via the API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@barangay.gov",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

Or use Prisma Studio to create a user directly:

```bash
cd backend
npx prisma studio
```

Then create a user with a hashed password (use bcrypt to hash the password first).

## Project Structure

```
BIS/
├── backend/              # Express backend API
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── middleware/  # Auth, upload middleware
│   │   ├── utils/        # Utilities (PDF, QR codes)
│   │   └── server.ts     # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/             # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── package.json
├── docs/                 # Documentation
└── README.md
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features Overview

1. **Resident Information** - Manage resident profiles
2. **Household Profiling** - Group residents by household
3. **Document Issuance** - Generate certificates (PDF)
4. **Incident Reporting** - Track incidents and cases
5. **Project Management** - Manage barangay projects
6. **Official Directory** - Track officials and attendance
7. **Blotter System** - Log and track blotter entries
8. **Financial Management** - Budget and expense tracking
9. **Announcements** - Post announcements and events
10. **Disaster Response** - Track disasters and relief
11. **Inventory Management** - Track equipment with QR codes
12. **Audit Trail** - Complete activity logging

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Port Already in Use
- Change PORT in backend/.env
- Update NEXT_PUBLIC_API_URL in frontend/.env.local

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate reset` to reset database (development only)

### Build Errors
- Delete node_modules and package-lock.json
- Run `npm install` again
- Clear Next.js cache: `rm -rf .next`

## Next Steps

1. Review the API documentation: `docs/API.md`
2. Check deployment guide: `docs/DEPLOYMENT.md`
3. Explore the database schema: `docs/SCHEMA.md`
4. Customize the UI to match your barangay's branding
5. Set up cloud storage for file uploads
6. Configure email notifications (optional)
7. Set up monitoring and logging

## Support

For issues or questions, please refer to the documentation in the `docs/` directory.



