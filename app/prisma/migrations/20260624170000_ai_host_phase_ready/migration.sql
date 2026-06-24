-- AlterTable
ALTER TABLE "GameSession" ADD COLUMN IF NOT EXISTS "aiNarration" TEXT;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "phaseReady" BOOLEAN NOT NULL DEFAULT false;

-- Align autoHost default with AI-first lobby flow
ALTER TABLE "GameSession" ALTER COLUMN "autoHost" SET DEFAULT true;
