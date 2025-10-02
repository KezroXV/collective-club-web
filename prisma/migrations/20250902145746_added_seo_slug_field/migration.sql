/*
  Warnings:

  - A unique constraint covering the columns `[shopId,slug]` on the table `posts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "posts_shopId_slug_key" ON "public"."posts"("shopId", "slug");
