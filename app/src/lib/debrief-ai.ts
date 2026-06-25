// AI debrief: one Gemini call → overall + per-participant grade (1–10) and comment.

import type { BadgeType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { generateJson, isGeminiQuotaError } from "./ai";
import { BADGE_LABELS, scoreLabel } from "./labels";
import { formatThousandDong } from "./money";
import type { ParticipantOutcome } from "./finalize";
import type { AiDebriefParticipantReview, AiDebriefReview } from "./debrief-review";
import { parseAiDebrief } from "./debrief-review";

interface AiDebriefJson {
  overall: { grade: number; comment: string };
  participants: { participantId: string; grade: number; comment: string }[];
}

const ROLE_VI: Record<string, string> = {
  PRODUCER: "Người sản xuất",
  CONSUMER: "Người tiêu dùng",
  INTERMEDIARY: "Trung gian",
  GOVERNMENT: "Nhà nước",
};

function clampGrade(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function formatOutcomeLine(o: ParticipantOutcome, badgeTypes: BadgeType[]): string {
  const role = ROLE_VI[o.role] ?? o.role;
  const metric = scoreLabel(o.role);
  const score =
    o.role === "GOVERNMENT" ? `${o.scoreVnd} điểm` : formatThousandDong(o.scoreVnd);
  const parts = [
    `id=${o.participantId}`,
    `tên=${o.displayName}`,
    `vai=${role}`,
    o.isBot ? "bot" : "người",
    `${metric}=${score}`,
  ];
  if (o.role === "CONSUMER") {
    parts.push(`đáp_ứng=${o.fulfilledUnits ?? 0}/${o.needUnits ?? 0}`);
    if (o.avgBuyPriceVnd != null) {
      parts.push(`giá_mua_TB=${formatThousandDong(o.avgBuyPriceVnd)}`);
    }
  }
  if (badgeTypes.length > 0) {
    parts.push(`danh_hiệu=${badgeTypes.map((t) => BADGE_LABELS[t] ?? t).join(", ")}`);
  }
  return parts.join("; ");
}

function fallbackReview(outcomes: ParticipantOutcome[]): AiDebriefReview {
  return {
    overall: {
      grade: 6,
      comment:
        "Phiên đã kết thúc. Hãy so sánh giá thị trường với giá trị xã hội và cách từng vai phản ứng với cung–cầu.",
    },
    participants: outcomes.map((o) => ({
      participantId: o.participantId,
      grade: 6,
      comment: o.isBot
        ? `${o.displayName} (bot) tham gia mô phỏng thị trường.`
        : `Kết quả ${scoreLabel(o.role)}: ${
            o.role === "GOVERNMENT"
              ? `${o.scoreVnd} điểm`
              : formatThousandDong(o.scoreVnd)
          }.`,
    })),
  };
}

/** Single AI call: session overview + each participant's pedagogical grade & feedback. */
export async function generateAiDebriefReview(input: {
  outcomes: ParticipantOutcome[];
  badges: { participantId: string; type: BadgeType }[];
  marketLines: string[];
  sessionCompleted: boolean;
}): Promise<AiDebriefReview> {
  const { outcomes, badges, marketLines, sessionCompleted } = input;
  if (outcomes.length === 0) return fallbackReview([]);

  const badgesByParticipant = new Map<string, BadgeType[]>();
  for (const b of badges) {
    const list = badgesByParticipant.get(b.participantId) ?? [];
    list.push(b.type);
    badgesByParticipant.set(b.participantId, list);
  }

  const participantLines = outcomes.map((o) =>
    formatOutcomeLine(o, badgesByParticipant.get(o.participantId) ?? []),
  );

  const systemInstruction =
    "Bạn là trợ giảng Kinh tế Chính trị Mác-Lênin, chấm điểm và nhận xét phiên mô phỏng chợ thanh long. " +
    "Trả về JSON hợp lệ. Điểm (grade) là số nguyên 1–10 về mức độ hiểu và thực hành kinh tế chính trị, " +
    "KHÔNG thay thế lợi nhuận/hiệu ích trong game. " +
    "Không đánh đồng giá trị với giá cả. Viết tiếng Việt, mỗi comment 2–3 câu, cụ thể theo số liệu. " +
    "participantId phải khớp chính xác id trong dữ liệu.";

  const prompt =
    `Phiên ${sessionCompleted ? "hoàn tất đủ 4 vòng" : "chưa hoàn tất đủ 4 vòng"}.\n` +
    `Thị trường: ${marketLines.join("; ") || "không có snapshot"}.\n\n` +
    `Người tham gia (${outcomes.length}):\n${participantLines.join("\n")}\n\n` +
    `Trả JSON:\n` +
    `{"overall":{"grade":<1-10>,"comment":"<nhận xét chung phiên>"},` +
    `"participants":[{"participantId":"<uuid>","grade":<1-10>,"comment":"<nhận xét cá nhân>"},...]}\n` +
    `Phải có đủ ${outcomes.length} mục participants, mỗi participantId đúng một lần.`;

  try {
    const raw = await generateJson<AiDebriefJson>({ systemInstruction, prompt });
    const byId = new Map(
      (raw.participants ?? []).map((p) => [p.participantId, p]),
    );

    const participants: AiDebriefParticipantReview[] = outcomes.map((o) => {
      const hit = byId.get(o.participantId);
      return {
        participantId: o.participantId,
        grade: clampGrade(hit?.grade ?? 5),
        comment:
          hit?.comment?.trim() ||
          (o.isBot
            ? `Bot ${o.displayName} hỗ trợ mô phỏng.`
            : `Tham gia vai ${ROLE_VI[o.role] ?? o.role}.`),
      };
    });

    return {
      overall: {
        grade: clampGrade(raw.overall?.grade ?? 6),
        comment:
          raw.overall?.comment?.trim() ||
          "Phiên mô phỏng cho thấy giá cả dao động quanh giá trị theo cung–cầu.",
      },
      participants,
    };
  } catch (e) {
    if (!isGeminiQuotaError(e)) console.error("debrief-ai:", e);
    return fallbackReview(outcomes);
  }
}

/** Backfill AI review for sessions finalized before aiDebrief existed. */
export async function ensureAiDebriefReview(input: {
  sessionId: string;
  outcomes: ParticipantOutcome[];
  badges: { participantId: string; type: BadgeType }[];
  analytics: { number: number; unitValueVnd: number; marketPriceVnd: number | null }[];
  sessionCompleted: boolean;
  existing: unknown;
}): Promise<AiDebriefReview | null> {
  const parsed = parseAiDebrief(input.existing);
  if (parsed) return parsed;
  if (input.outcomes.length === 0) return null;

  const marketLines = input.analytics.map(
    (a) =>
      `Vòng ${a.number}: giá trị ${formatThousandDong(a.unitValueVnd)}, giá thị trường ${
        a.marketPriceVnd === null ? "không hình thành" : formatThousandDong(a.marketPriceVnd)
      }`,
  );

  const review = await generateAiDebriefReview({
    outcomes: input.outcomes,
    badges: input.badges,
    marketLines,
    sessionCompleted: input.sessionCompleted,
  });

  const { db } = await import("./db");
  await db.sessionResult.update({
    where: { sessionId: input.sessionId },
    data: {
      aiDebrief: review as unknown as Prisma.InputJsonValue,
      narration: review.overall.comment,
    },
  });

  return review;
}
