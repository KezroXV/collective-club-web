/*
  Warnings:

  - You are about to drop the column `requiredCount` on the `badges` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `badges` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,name]` on the table `badges` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,shopId]` on the table `customization_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requiredPoints` to the `badges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `badges` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `customization_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `poll_options` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `poll_votes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `polls` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `reactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `shopId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."PointAction" AS ENUM ('POST_CREATED', 'COMMENT_CREATED', 'REACTION_RECEIVED', 'BADGE_UNLOCKED', 'DAILY_LOGIN');

-- DropForeignKey
ALTER TABLE "public"."badges" DROP CONSTRAINT "badges_userId_fkey";

-- DropIndex
DROP INDEX "public"."categories_name_key";

-- DropIndex
DROP INDEX "public"."customization_settings_userId_key";

-- DropIndex
DROP INDEX "public"."users_email_key";

-- DropIndex
DROP INDEX "public"."users_shopDomain_key";

-- AlterTable
ALTER TABLE "public"."badges" DROP COLUMN "requiredCount",
DROP COLUMN "userId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "requiredPoints" INTEGER NOT NULL,
ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."customization_settings" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."poll_options" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."poll_votes" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."polls" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."reactions" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "shopId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."shops" (
    "id" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."point_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "action" "public"."PointAction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userPointsId" TEXT NOT NULL,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_shopDomain_key" ON "public"."shops"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "public"."follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_points_userId_shopId_key" ON "public"."user_points"("userId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "public"."user_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_shopId_name_key" ON "public"."badges"("shopId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_shopId_name_key" ON "public"."categories"("shopId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customization_settings_userId_shopId_key" ON "public"."customization_settings"("userId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "users_shopId_email_key" ON "public"."users"("shopId", "email");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."polls" ADD CONSTRAINT "polls_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customization_settings" ADD CONSTRAINT "customization_settings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."badges" ADD CONSTRAINT "badges_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_points" ADD CONSTRAINT "user_points_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_points" ADD CONSTRAINT "user_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."point_transactions" ADD CONSTRAINT "point_transactions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."point_transactions" ADD CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."point_transactions" ADD CONSTRAINT "point_transactions_userPointsId_fkey" FOREIGN KEY ("userPointsId") REFERENCES "public"."user_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
