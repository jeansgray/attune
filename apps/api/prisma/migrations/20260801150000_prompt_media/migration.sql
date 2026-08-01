-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "Prompt" ADD COLUMN "mediaUrl" TEXT;
