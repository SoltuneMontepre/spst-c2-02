/** Shared AI debrief review shapes (client + server safe). */

export interface AiDebriefParticipantReview {
  participantId: string;
  grade: number;
}

export interface AiDebriefReview {
  overall: {
    grade: number;
    comment: string;
  };
  participants: AiDebriefParticipantReview[];
}

function clampGrade(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

export function aiReviewByParticipantId(
  review: AiDebriefReview | null,
): Map<string, AiDebriefParticipantReview> {
  const map = new Map<string, AiDebriefParticipantReview>();
  if (!review) return map;
  for (const p of review.participants) map.set(p.participantId, p);
  return map;
}

export function parseAiDebrief(raw: unknown): AiDebriefReview | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as AiDebriefReview;
  if (
    typeof r.overall?.grade !== "number" ||
    typeof r.overall?.comment !== "string" ||
    !Array.isArray(r.participants)
  ) {
    return null;
  }
  return {
    overall: {
      grade: clampGrade(r.overall.grade),
      comment: r.overall.comment,
    },
    participants: r.participants.map((p) => ({
      participantId: p.participantId,
      grade: clampGrade(p.grade),
    })),
  };
}
