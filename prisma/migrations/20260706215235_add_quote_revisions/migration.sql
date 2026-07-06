-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "revisedFromId" TEXT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_revisedFromId_fkey" FOREIGN KEY ("revisedFromId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
