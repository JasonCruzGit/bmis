-- AlterTable - Add barangay column (nullable)
ALTER TABLE "inventory_items" ADD COLUMN "barangay" TEXT;

-- AlterTable - Add created_by column (nullable first)
ALTER TABLE "inventory_items" ADD COLUMN "created_by" TEXT;

-- Update existing records to use first admin user
UPDATE "inventory_items" 
SET "created_by" = (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
WHERE "created_by" IS NULL;

-- Make created_by NOT NULL after updating existing records
ALTER TABLE "inventory_items" ALTER COLUMN "created_by" SET NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_items_barangay_idx" ON "inventory_items"("barangay");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

