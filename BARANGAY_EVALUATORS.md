# Barangay Evaluator Accounts - El Nido

## Overview
Created 18 Barangay Evaluator accounts, one for each barangay in El Nido, Palawan.

## Created Accounts

All accounts use the default password: **`evaluator123`**

⚠️ **Important:** Change passwords after first login!

| # | Barangay | Email | Password |
|---|----------|-------|----------|
| 1 | Bagong Bayan | evaluator.bagong.bayan@elnido.gov.ph | evaluator123 |
| 2 | Buena Suerte | evaluator.buena.suerte@elnido.gov.ph | evaluator123 |
| 3 | Barotuan | evaluator.barotuan@elnido.gov.ph | evaluator123 |
| 4 | Bebeladan | evaluator.bebeladan@elnido.gov.ph | evaluator123 |
| 5 | Corong-corong | evaluator.corong-corong@elnido.gov.ph | evaluator123 |
| 6 | Mabini | evaluator.mabini@elnido.gov.ph | evaluator123 |
| 7 | Manlag | evaluator.manlag@elnido.gov.ph | evaluator123 |
| 8 | Masagana | evaluator.masagana@elnido.gov.ph | evaluator123 |
| 9 | New Ibajay | evaluator.new.ibajay@elnido.gov.ph | evaluator123 |
| 10 | Pasadeña | evaluator.pasadeña@elnido.gov.ph | evaluator123 |
| 11 | Maligaya | evaluator.maligaya@elnido.gov.ph | evaluator123 |
| 12 | San Fernando | evaluator.san.fernando@elnido.gov.ph | evaluator123 |
| 13 | Sibaltan | evaluator.sibaltan@elnido.gov.ph | evaluator123 |
| 14 | Teneguiban | evaluator.teneguiban@elnido.gov.ph | evaluator123 |
| 15 | Villa Libertad | evaluator.villa.libertad@elnido.gov.ph | evaluator123 |
| 16 | Villa Paz | evaluator.villa.paz@elnido.gov.ph | evaluator123 |
| 17 | Bucana | evaluator.bucana@elnido.gov.ph | evaluator123 |
| 18 | Aberawan | evaluator.aberawan@elnido.gov.ph | evaluator123 |

## Role Details

- **Role:** `BARANGAY_EVALUATOR`
- **Barangay Field:** Each account is assigned to their specific barangay
- **Status:** All accounts are active

## How to Recreate Accounts

If you need to recreate these accounts, run:

```bash
cd backend
npm run create-evaluators
```

Or manually:

```bash
cd backend
tsx scripts/create-barangay-evaluators.ts
```

## Customizing Password

Set the `EVALUATOR_PASSWORD` environment variable in `backend/.env`:

```env
EVALUATOR_PASSWORD=your-custom-password
```

## Database Changes

1. Added `BARANGAY_EVALUATOR` to `UserRole` enum
2. Added `barangay` field to `User` model (optional field)
3. Updated user controller to handle barangay field

## Frontend Updates

- Added `BARANGAY_EVALUATOR` role to user management page
- Added barangay dropdown when creating/editing evaluators
- Added barangay column to users table
- Barangay field is required when role is `BARANGAY_EVALUATOR`

## Access

These accounts can log in at: `http://localhost:3000/login`

