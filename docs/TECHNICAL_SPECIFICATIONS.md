# Barangay Management Information System - Technical Specifications

## Architecture Overview
**Type:** Full-Stack Web Application  
**Architecture Pattern:** RESTful API with Client-Server Architecture  
**Deployment Model:** Cloud-based (Frontend: Vercel, Backend: Render)

---

## Frontend Technology Stack

### Core Framework
- **Next.js 14.0.4** - React framework with App Router
- **React 18.2.0** - UI library
- **TypeScript 5.3.3** - Type-safe JavaScript

### UI & Styling
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Lucide React 0.303.0** - Icon library
- **Recharts 2.10.3** - Charting library

### State Management & Data Fetching
- **Zustand 4.4.7** - Lightweight state management
- **React Query 3.39.3** - Server state management
- **Axios 1.6.2** - HTTP client

### Forms & Validation
- **React Hook Form 7.49.2** - Form handling
- **React Hot Toast 2.4.1** - Toast notifications

### Additional Libraries
- **date-fns 3.0.6** - Date manipulation
- **qrcode.react 3.1.0** - QR code generation

---

## Backend Technology Stack

### Core Framework
- **Node.js 22.16.0** - Runtime environment
- **Express 4.18.2** - Web framework
- **TypeScript 5.3.3** - Type-safe JavaScript

### Database & ORM
- **PostgreSQL** - Relational database
- **Prisma 5.7.1** - ORM and database toolkit
- **Prisma Client** - Type-safe database client

### Authentication & Security
- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
- **bcryptjs 2.4.3** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing

### Validation & Utilities
- **express-validator 7.0.1** - Request validation
- **Zod 3.22.4** - Schema validation

### File Processing
- **Multer 1.4.5** - File upload handling
- **PDFKit 0.14.0** - PDF generation
- **XLSX 0.18.5** - Excel file processing
- **QRCode 1.5.3** - QR code generation

---

## Database Schema

### Core Models
- **User** - Admin/Staff accounts with role-based access
- **Resident** - Resident information and profiles
- **Household** - Household management
- **Document** - Document templates and records
- **DocumentRequest** - Resident document requests
- **Announcement** - Public announcements
- **BlotterEntry** - Incident/blotter records
- **Incident** - Emergency incident tracking
- **Project** - Barangay project management
- **FinancialRecord** - Financial transactions
- **Inventory** - Inventory management
- **InventoryLog** - Inventory transaction logs
- **Official** - Barangay officials directory
- **AuditLog** - System activity logs
- **PurchaseOrder** - Purchase order management
- **Quotation** - Vendor quotations

### Key Features
- UUID primary keys
- Timestamp tracking (createdAt, updatedAt)
- Soft delete support
- Relationship mapping with Prisma

---

## Authentication & Authorization

### Admin Portal
- **Method:** Email/Password authentication
- **Token:** JWT with role-based access control
- **Roles:** ADMIN, STAFF
- **Session:** Token-based (stored in localStorage)

### Resident Portal
- **Method:** Contact Number + Date of Birth (initial) / Password (subsequent)
- **Flow:** First login prompts password setup
- **Token:** JWT for authenticated sessions

---

## API Architecture

### RESTful Endpoints
- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management
- `/api/residents/*` - Resident management
- `/api/households/*` - Household management
- `/api/documents/*` - Document management
- `/api/announcements/*` - Announcement management
- `/api/blotter/*` - Blotter entries
- `/api/incidents/*` - Incident management
- `/api/projects/*` - Project management
- `/api/inventory/*` - Inventory management
- `/api/financial/*` - Financial records
- `/api/officials/*` - Officials directory
- `/api/audit/*` - Audit logs
- `/api/resident-portal/*` - Resident portal endpoints

### Request/Response Format
- **Format:** JSON
- **Validation:** Express Validator + Zod schemas
- **Error Handling:** Standardized error responses

---

## File Storage

### Current Implementation
- **Local Storage** - Files stored in `backend/uploads/`
- **Supported Types:** Images, PDFs, Documents
- **File Upload:** Multer middleware

### File Organization
- `/uploads/documents/` - Document files
- `/uploads/residents/` - Resident photos
- `/uploads/announcements/` - Announcement attachments

---

## Deployment

### Frontend (Vercel)
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment:** Production-ready with automatic SSL

### Backend (Render)
- **Platform:** Render
- **Runtime:** Node.js 22.16.0
- **Build Command:** `npm install; npm run build`
- **Start Command:** `npm start`
- **Database:** PostgreSQL (Render managed)

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend origin for CORS
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `ADMIN_EMAIL` - Default admin email
- `ADMIN_PASSWORD` - Default admin password

---

## Development Tools

### Build Tools
- **TypeScript Compiler** - Type checking and compilation
- **tsx** - TypeScript execution for scripts
- **ESLint** - Code linting

### Database Tools
- **Prisma Studio** - Database GUI
- **Prisma Migrate** - Database migrations

### Testing
- **Jest 29.7.0** - Testing framework
- **ts-jest** - TypeScript Jest transformer

---

## Key Technical Features

1. **Type Safety** - Full TypeScript implementation across frontend and backend
2. **Auto Migrations** - Prisma migrations run automatically on deployment
3. **Auto Admin Setup** - Admin user creation/password reset on server startup
4. **CORS Protection** - Configured for production cross-origin requests
5. **File Upload** - Multi-part form data handling with validation
6. **PDF Generation** - Dynamic PDF document generation
7. **QR Code Generation** - QR codes for documents and residents
8. **Excel Export** - Data export to Excel format
9. **Audit Logging** - Comprehensive activity tracking
10. **Role-Based Access** - Multi-level permission system

---

## Performance & Scalability

- **Frontend:** Static generation where possible, server-side rendering for dynamic content
- **Backend:** Stateless API design, ready for horizontal scaling
- **Database:** Indexed queries, optimized relationships
- **Caching:** React Query for client-side caching

---

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- CORS protection
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- Role-based access control
- Audit logging for sensitive operations

---

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive Web App capabilities

---

*Last Updated: November 2024*

