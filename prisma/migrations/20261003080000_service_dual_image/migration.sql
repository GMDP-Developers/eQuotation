-- AlterTable
ALTER TABLE "Service" RENAME COLUMN "image" TO "imagePreview";
ALTER TABLE "Service" ADD COLUMN "imageFull" TEXT;
