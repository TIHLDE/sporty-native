-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('trening', 'kamp', 'sosialt', 'annet');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "signupDeadline" TIMESTAMP(3),
ADD COLUMN     "type" "EventType" NOT NULL DEFAULT 'annet',
ALTER COLUMN "endsAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Place_groupId_lastUsedAt_idx" ON "Place"("groupId", "lastUsedAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
