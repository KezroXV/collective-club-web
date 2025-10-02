-- CreateTable
CREATE TABLE "public"."customization_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "colorPosts" TEXT NOT NULL DEFAULT '#3B82F6',
    "colorBorders" TEXT NOT NULL DEFAULT '#E5E7EB',
    "colorBg" TEXT NOT NULL DEFAULT '#F9FAFB',
    "colorText" TEXT NOT NULL DEFAULT '#111827',
    "selectedFont" TEXT NOT NULL DEFAULT 'Inter',
    "coverImageUrl" TEXT,
    "customBadges" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customization_settings_userId_key" ON "public"."customization_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."customization_settings" ADD CONSTRAINT "customization_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
