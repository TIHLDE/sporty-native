-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photonId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_photonId_key" ON "User"("photonId");
