-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN     "paused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pausedRemainingMs" INTEGER;
