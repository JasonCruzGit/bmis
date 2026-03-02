-- Add missing address columns to residents table
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "purok_sitio" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "municipality" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "street_subdivision" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "zone" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "house_building_number" TEXT;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "unit_number" TEXT;

-- Add missing columns to households table
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "head_first_name" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "head_middle_name" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "head_last_name" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "house_number" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "purok_sitio" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "street_subdivision" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "barangay" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "zone" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "municipality" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "house_building_number" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "unit_number" TEXT;


