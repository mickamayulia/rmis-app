-- AlterTable
ALTER TABLE "repairs" ADD COLUMN     "estimated_completion" TIMESTAMP(3),
ADD COLUMN     "labor_cost" DOUBLE PRECISION,
ADD COLUMN     "material_cost" DOUBLE PRECISION,
ADD COLUMN     "pdf_path" TEXT;
