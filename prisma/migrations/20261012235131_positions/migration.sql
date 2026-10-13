-- CreateEnum
CREATE TYPE "Position" AS ENUM ('keeper', 'back', 'midtstopper', 'midtbane', 'ving', 'spiss');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "usesPositions" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "position" "Position";
