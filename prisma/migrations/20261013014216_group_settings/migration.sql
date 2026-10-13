-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ourScore" INTEGER,
ADD COLUMN     "theirScore" INTEGER;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "coverUploadId" TEXT;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_coverUploadId_fkey" FOREIGN KEY ("coverUploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
