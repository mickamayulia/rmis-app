-- AlterTable
ALTER TABLE "repairs" ADD COLUMN     "address" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "inspections" JSONB,
ADD COLUMN     "jam" TEXT,
ADD COLUMN     "procedures" JSONB;
