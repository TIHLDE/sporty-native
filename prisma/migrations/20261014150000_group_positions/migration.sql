-- Posisjoner blir en egen liste per gruppe i stedet for en fast enum. Grupper som allerede
-- bruker posisjoner får de seks gamle fotballposisjonene, og spillerne beholder sin posisjon.

-- CreateTable
CREATE TABLE "GroupPosition" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "GroupPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupPosition_groupId_sortOrder_idx" ON "GroupPosition"("groupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPosition_groupId_name_key" ON "GroupPosition"("groupId", "name");

-- AddForeignKey
ALTER TABLE "GroupPosition" ADD CONSTRAINT "GroupPosition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Startliste for grupper som bruker posisjoner, og for grupper der noen har en posisjon.
INSERT INTO "GroupPosition" ("id", "groupId", "name", "sortOrder")
SELECT md5(g."id" || ':' || p."value"), g."id", p."name", p."sortOrder"
FROM "Group" g
CROSS JOIN (VALUES
    ('keeper', 'Keeper', 0),
    ('back', 'Back', 1),
    ('midtstopper', 'Midtstopper', 2),
    ('midtbane', 'Midtbane', 3),
    ('ving', 'Ving', 4),
    ('spiss', 'Spiss', 5)
) AS p("value", "name", "sortOrder")
WHERE g."usesPositions" OR EXISTS (
    SELECT 1 FROM "Membership" m WHERE m."groupId" = g."id" AND m."position" IS NOT NULL
);

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "positionId" TEXT;

-- Flytt spillernes posisjon over til den nye listen.
UPDATE "Membership" m
SET "positionId" = md5(m."groupId" || ':' || m."position"::text)
WHERE m."position" IS NOT NULL;

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "position";

-- DropEnum
DROP TYPE "Position";

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "GroupPosition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
