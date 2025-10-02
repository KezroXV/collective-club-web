/*
  Warnings:

  - A unique constraint covering the columns `[shopDomain]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "users_shopDomain_key" ON "public"."users"("shopDomain");
