# Barangay Management Information System - All Links

## Base URLs

### Development
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`

### Production
- Update these based on your deployment configuration

---

## Frontend Pages (Admin Portal)

### Authentication
- **Login**: `/login`
- **Dashboard**: `/dashboard`

### Resident Management
- **Residents List**: `/residents`
- **Add Residents**: `/add-residents`
- **View/Edit Resident**: `/residents/[id]`
- **Edit Resident**: `/residents/[id]/edit`

### Household Management
- **Households List**: `/households`
- **New Household**: `/households/new`
- **View/Edit Household**: `/households/[id]`
- **Edit Household**: `/households/[id]/edit`

### Document Management
- **Documents List**: `/documents`
- **New Document**: `/documents/new`

### Incident Management
- **Incidents List**: `/incidents`
- **New Incident**: `/incidents/new`
- **View/Edit Incident**: `/incidents/[id]`
- **Edit Incident**: `/incidents/[id]/edit`

### Project Management
- **Projects List**: `/projects`
- **New Project**: `/projects/new`
- **View/Edit Project**: `/projects/[id]`
- **Edit Project**: `/projects/[id]/edit`

### Officials Management
- **Officials List**: `/officials`
- **New Official**: `/officials/new`
- **View/Edit Official**: `/officials/[id]`
- **Edit Official**: `/officials/[id]/edit`

### Blotter System
- **Blotter List**: `/blotter`
- **New Blotter Entry**: `/blotter/new`
- **View/Edit Blotter**: `/blotter/[id]`
- **Edit Blotter**: `/blotter/[id]/edit`

### Financial Management
- **Financial Records**: `/financial`
- **New Financial Record**: `/financial/new`
- **View/Edit Financial**: `/financial/[id]`
- **Edit Financial**: `/financial/[id]/edit`

### Announcements
- **Announcements List**: `/announcements`
- **New Announcement**: `/announcements/new`
- **View/Edit Announcement**: `/announcements/[id]`
- **Edit Announcement**: `/announcements/[id]/edit`

### Inventory Management
- **Inventory List**: `/inventory`
- **New Inventory Item**: `/inventory/new`
- **View/Edit Inventory**: `/inventory/[id]`
- **Edit Inventory**: `/inventory/[id]/edit`

### Resident Requests
- **Resident Requests**: `/resident-requests`

### Purchase Orders
- **New Purchase Order**: `/purchase-orders/new`

### User Management
- **User Accounts**: `/users` (Admin only)

### Audit Logs
- **Audit Logs**: `/audit`

---

## Resident Portal (Public)

### Portal Landing
- **Portal Home**: `/portal`

### Portal Authentication
- **Portal Login**: `/portal/login`

### Portal Dashboard
- **Resident Dashboard**: `/portal/dashboard`

### Portal Services
- **My Documents**: `/portal/documents`
- **Announcements**: `/portal/announcements`
- **My Requests**: `/portal/requests`
- **New Request**: `/portal/requests/new`
- **View Request**: `/portal/requests/[id]`
- **Submit Complaint**: `/portal/complaints/new`

### Public Pages
- **Public Resident View**: `/public/resident/[id]`

---

## Backend API Endpoints

### Base URL: `http://localhost:5000/api`

### Health Check
- `GET /api/health` - Server health status

### Authentication (`/api/auth`)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/register` - Register new user (admin)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users (`/api/users`)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Residents (`/api/residents`)
- `GET /api/residents` - Get all residents
- `GET /api/residents/:id` - Get resident by ID
- `POST /api/residents` - Create resident
- `PUT /api/residents/:id` - Update resident
- `DELETE /api/residents/:id` - Delete resident
- `GET /api/residents/export` - Export residents

### Households (`/api/households`)
- `GET /api/households` - Get all households
- `GET /api/households/:id` - Get household by ID
- `POST /api/households` - Create household
- `PUT /api/households/:id` - Update household
- `DELETE /api/households/:id` - Delete household

### Documents (`/api/documents`)
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get document by ID
- `POST /api/documents` - Create document
- `GET /api/documents/types` - Get document types
- `GET /api/documents/:id/pdf` - Generate PDF

### Incidents (`/api/incidents`)
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### Projects (`/api/projects`)
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Officials (`/api/officials`)
- `GET /api/officials` - Get all officials
- `GET /api/officials/:id` - Get official by ID
- `POST /api/officials` - Create official
- `PUT /api/officials/:id` - Update official
- `DELETE /api/officials/:id` - Delete official
- `POST /api/officials/:id/attendance` - Record attendance
- `GET /api/officials/:id/attendance` - Get attendance

### Blotter (`/api/blotter`)
- `GET /api/blotter` - Get all blotter entries
- `GET /api/blotter/:id` - Get blotter entry by ID
- `POST /api/blotter` - Create blotter entry
- `PUT /api/blotter/:id` - Update blotter entry
- `DELETE /api/blotter/:id` - Delete blotter entry

### Financial (`/api/financial`)
- `GET /api/financial` - Get all financial records
- `GET /api/financial/:id` - Get financial record by ID
- `POST /api/financial` - Create financial record
- `PUT /api/financial/:id` - Update financial record
- `DELETE /api/financial/:id` - Delete financial record

### Announcements (`/api/announcements`)
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Disasters (`/api/disasters`)
- `GET /api/disasters` - Get all disasters
- `GET /api/disasters/:id` - Get disaster by ID
- `POST /api/disasters` - Create disaster
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster

### Inventory (`/api/inventory`)
- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get inventory item by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `GET /api/inventory/:id/qrcode` - Get QR code

### Audit (`/api/audit`)
- `GET /api/audit` - Get audit logs

### Resident Portal (`/api/portal`)
- `POST /api/portal/login` - Resident login
- `PUT /api/portal/password` - Set resident password
- `GET /api/portal/documents` - Get resident's documents
- `GET /api/portal/requests` - Get resident's requests
- `POST /api/portal/requests` - Create document request
- `GET /api/portal/requests/:id` - Get request details
- `POST /api/portal/complaints` - Submit complaint
- `GET /api/portal/announcements` - Get public announcements
- `GET /api/portal/document-types` - Get document types
- `POST /api/portal/payment-callback` - Payment callback

### Resident Requests (`/api/resident-requests`)
- `GET /api/resident-requests` - Get all resident requests (admin)
- `GET /api/resident-requests/:id` - Get request by ID
- `PUT /api/resident-requests/:id` - Update request status
- `DELETE /api/resident-requests/:id` - Delete request

---

## File Uploads

### Upload Directories
- **Documents**: `/uploads/documents/`
- **Residents**: `/uploads/residents/`
- **Officials**: `/uploads/officials/`
- **Incidents**: `/uploads/incidents/`
- **Announcements**: `/uploads/announcements/`
- **Projects**: `/uploads/projects/`
- **Financial**: `/uploads/financial/`
- **General**: `/uploads/general/`
- **QR Codes**: `/uploads/qrcodes/`

### Access Files
- `http://localhost:5000/uploads/[path]`

---

## Quick Access Links

### Admin Login
- URL: `http://localhost:3000/login`
- Default Email: `admin@barangay.gov.ph`
- Default Password: `p@ssword123`

### Resident Portal Login
- URL: `http://localhost:3000/portal/login`
- Login with: Contact Number + Password or Date of Birth

### API Health Check
- URL: `http://localhost:5000/api/health`

---

## Notes

- All API endpoints require authentication except:
  - `/api/auth/login`
  - `/api/auth/register`
  - `/api/portal/login`
  - `/api/portal/announcements`
  - `/api/health`

- Admin routes require ADMIN or BARANGAY_CHAIRMAN role

- Resident portal routes require resident authentication

- File uploads are served statically from `/uploads` directory

