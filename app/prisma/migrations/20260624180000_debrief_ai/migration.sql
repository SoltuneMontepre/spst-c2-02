-- AI debrief: overall + per-participant grades and comments (single generation).
ALTER TABLE "SessionResult" ADD COLUMN "aiDebrief" JSONB;
