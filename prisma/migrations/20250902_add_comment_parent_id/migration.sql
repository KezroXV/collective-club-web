-- AddColumn: parentId to Comment for nested comments
ALTER TABLE "comments" ADD COLUMN "parentId" TEXT;

-- AddForeignKey for self-referential relationship
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;