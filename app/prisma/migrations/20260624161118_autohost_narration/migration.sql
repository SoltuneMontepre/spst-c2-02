-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "autoHost" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SessionResult" ADD COLUMN     "narration" TEXT;
