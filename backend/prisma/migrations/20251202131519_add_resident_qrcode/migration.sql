-- AlterTable
ALTER TABLE "residents" ADD COLUMN "qr_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "residents_qr_code_key" ON "residents"("qr_code");



