-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "photonSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Group_photonSlug_key" ON "Group"("photonSlug");
