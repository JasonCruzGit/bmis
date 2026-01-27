# Barangay Information System (BIS)

A comprehensive Barangay Management Information System for managing residents, documents, incidents, inventory, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/barangay-information-system.git
   cd barangay-information-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Backend (`backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/bis_db
   JWT_SECRET=your-secret-key
   FRONTEND_URL=http://localhost:3000
   ```
   
   Frontend (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Create admin user**
   ```bash
   npm run create-admin
   ```

6. **Start development servers**
   ```bash
   # From root directory
   npm run dev
   ```

   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3000

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to:
- **GitHub**: Code repository
- **Vercel**: Frontend hosting
- **Render**: Backend API and PostgreSQL database

## 🏗️ Project Structure

```
BIS/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/       # Database schema and migrations
├── frontend/         # Next.js frontend application
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   └── lib/          # Utilities and API clients
└── docs/             # Documentation
```

## 🔑 Features

- **Resident Management**: Complete resident registration and management
- **Document Management**: Issue and track barangay documents
- **Incident Management**: Record and track incidents and complaints
- **Inventory Management**: Track barangay equipment and supplies
- **Financial Records**: Manage financial transactions
- **Project Management**: Track barangay projects
- **Announcements**: Publish and manage announcements
- **Resident Portal**: Self-service portal for residents
- **Audit Logs**: Complete audit trail of all actions

## 🛠️ Tech Stack

**Backend:**
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Query

## 📝 License

Private - All rights reserved

## 👥 Support

For issues and questions, please contact the development team.
