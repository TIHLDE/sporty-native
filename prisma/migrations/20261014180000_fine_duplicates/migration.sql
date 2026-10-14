-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "collectiveFineAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FineRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FineRequest_pkey" PRIMARY KEY ("id")
);

