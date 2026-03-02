-- AlterTable
ALTER TABLE "households" ADD COLUMN "basal_body_temperature" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cervical_mucus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lactational_mucus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "rhythm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "standard_days_method" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sympto_thermal_method" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "withdrawal" BOOLEAN NOT NULL DEFAULT false;


