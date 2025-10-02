-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedBy" TEXT,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;
