-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN "lobbySoloSince" TIMESTAMP(3);

-- Backfill solo timers for existing empty lobbies
UPDATE "GameSession" gs
SET "lobbySoloSince" = gs."createdAt"
WHERE gs."status" = 'LOBBY'
  AND (
    SELECT COUNT(*)::int
    FROM "Participant" p
    WHERE p."sessionId" = gs."id" AND p."isBot" = false
  ) <= 1;
