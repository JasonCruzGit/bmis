-- AlterTable
ALTER TABLE "announcements" ADD COLUMN "target_barangays" TEXT[] DEFAULT ARRAY[]::TEXT[];

