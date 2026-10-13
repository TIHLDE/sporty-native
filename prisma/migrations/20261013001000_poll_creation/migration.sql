-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "allowComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "hideVotes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PollVote" DROP CONSTRAINT "PollVote_pkey",
ADD CONSTRAINT "PollVote_pkey" PRIMARY KEY ("optionId", "userId");

-- CreateTable
CREATE TABLE "PollComment" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PollComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PollComment_pollId_createdAt_idx" ON "PollComment"("pollId", "createdAt");

-- CreateIndex
CREATE INDEX "PollVote_pollId_userId_idx" ON "PollVote"("pollId", "userId");

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollComment" ADD CONSTRAINT "PollComment_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollComment" ADD CONSTRAINT "PollComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

