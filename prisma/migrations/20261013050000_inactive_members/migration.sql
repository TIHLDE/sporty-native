-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "inactiveReason" TEXT,
ADD COLUMN     "inactiveSince" TIMESTAMP(3);
