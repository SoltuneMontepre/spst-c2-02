import type { BadgeType, Role } from "@/generated/prisma/enums";
import { db } from "./db";
import type { ParticipantOutcome } from "./finalize";
import { BADGE_LABELS } from "./labels";
import { formatTopRoleShort } from "./profile-labels";

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export interface ProfileStats {
  sessionsPlayed: number;
  totalScore: number;
  roundsCompleted: number;
  wins: number;
  topRole: Role | null;
}

export interface ProfileBadgeItem {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface ProfileLearningTopic {
  id: string;
  label: string;
  percent: number;
}

export interface ProfileDashboard {
  profile: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    school: string | null;
    gradeClass: string | null;
  };
  stats: ProfileStats;
  proficiencyStars: number;
  badges: ProfileBadgeItem[];
  learningProgress: ProfileLearningTopic[];
}

const BADGE_CATALOG: Array<{
  id: BadgeType | "OBSERVER" | "ROUND3_CHAMPION";
  label: string;
  description: string;
  badgeType?: BadgeType;
}> = [
  {
    id: "EFFICIENT_PRODUCER",
    label: "Nhà SX hiệu quả",
    description: "Lợi nhuận cao nhất",
    badgeType: "EFFICIENT_PRODUCER",
  },
  {
    id: "MARKET_CONNECTOR",
    label: "Thương lượng giỏi",
    description: "10+ giao dịch thành công",
    badgeType: "MARKET_CONNECTOR",
  },
  {
    id: "OBSERVER",
    label: "Nhà quan sát",
    description: "Phân tích chính xác",
  },
  {
    id: "WISE_CONSUMER",
    label: "Người chơi mẫu",
    description: "Tiêu dùng thông thái",
    badgeType: "WISE_CONSUMER",
  },
  {
    id: "BALANCED_REGULATOR",
    label: "Nhà điều phối",
    description: "Điều tiết cân bằng",
    badgeType: "BALANCED_REGULATOR",
  },
  {
    id: "ROUND3_CHAMPION",
    label: "Vô địch vòng 3",
    description: "Chưa đạt được",
  },
];

const LEARNING_TOPICS = [
  { id: "value", label: "Giá trị hàng hóa" },
  { id: "supply", label: "Cung-cầu & giá cả" },
  { id: "roles", label: "Vai trò thị trường" },
  { id: "law", label: "Quy luật giá trị" },
] as const;

function computeProficiencyStars(sessionsPlayed: number, roundsCompleted: number): number {
  if (sessionsPlayed === 0) return 0;
  const raw = Math.floor(sessionsPlayed / 2) + Math.floor(roundsCompleted / 8);
  return Math.min(5, Math.max(1, raw));
}

function computeLearningProgress(
  sessionsPlayed: number,
  roundsCompleted: number,
  roleCount: number,
): ProfileLearningTopic[] {
  const base = Math.min(100, sessionsPlayed * 8 + roundsCompleted * 2);
  const roleBoost = roleCount * 12;
  return LEARNING_TOPICS.map((topic, i) => {
    const offset = i * 5;
    const percent = Math.min(100, Math.max(0, base + roleBoost - offset));
    return { ...topic, percent };
  });
}

/** Aggregated profile dashboard: stats, badges, and learning progress. */
export async function getProfileDashboard(userId: string): Promise<ProfileDashboard> {
  const [user, participants, earnedBadges] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        school: true,
        gradeClass: true,
      },
    }),
    db.participant.findMany({
      where: { userId, isBot: false },
      include: {
        session: {
          include: { result: { select: { participantOutcomes: true } } },
        },
      },
    }),
    db.badge.findMany({
      where: { participant: { userId, isBot: false } },
      select: { type: true },
      distinct: ["type"],
    }),
  ]);

  const fourWeeksAgo = new Date(Date.now() - FOUR_WEEKS_MS);
  let sessionsPlayed = 0;
  let totalScore = 0;
  let roundsCompleted = 0;
  let wins = 0;
  const roleCounts = new Map<Role, number>();
  const earnedTypes = new Set(earnedBadges.map((b) => b.type));

  for (const p of participants) {
    const s = p.session;
    if (p.role) roleCounts.set(p.role, (roleCounts.get(p.role) ?? 0) + 1);

    const outcomes = s.result?.participantOutcomes as ParticipantOutcome[] | undefined;
    const selfOutcome = outcomes?.find((o) => o.participantId === p.id);

    if (
      (s.status === "COMPLETED" || s.status === "INCOMPLETE") &&
      s.endedAt &&
      s.endedAt >= fourWeeksAgo
    ) {
      sessionsPlayed++;
      roundsCompleted += s.currentRound;
      if (selfOutcome) {
        totalScore += selfOutcome.scoreVnd;
        const humanOutcomes = outcomes?.filter((o) => !o.isBot) ?? [];
        const topScore = Math.max(...humanOutcomes.map((o) => o.scoreVnd), 0);
        if (selfOutcome.scoreVnd >= topScore && topScore > 0) wins++;
      }
    }
  }

  let topRole: Role | null = null;
  let maxRoleCount = 0;
  for (const [role, count] of roleCounts) {
    if (count > maxRoleCount) {
      maxRoleCount = count;
      topRole = role;
    }
  }

  const stats: ProfileStats = {
    sessionsPlayed,
    totalScore,
    roundsCompleted,
    wins,
    topRole,
  };

  const badges: ProfileBadgeItem[] = BADGE_CATALOG.map((item) => ({
    id: item.id,
    label: item.badgeType ? BADGE_LABELS[item.badgeType] : item.label,
    description: item.description,
    earned: item.badgeType ? earnedTypes.has(item.badgeType) : false,
  }));

  // Override display labels for catalog entries that differ from BADGE_LABELS
  badges[0]!.label = "Nhà SX hiệu quả";
  badges[1]!.label = "Thương lượng giỏi";
  badges[2]!.label = "Nhà quan sát";
  badges[3]!.label = "Người chơi mẫu";
  badges[4]!.label = "Nhà điều phối";
  badges[5]!.label = "Vô địch vòng 3";

  const proficiencyStars = computeProficiencyStars(sessionsPlayed, roundsCompleted);
  const learningProgress = computeLearningProgress(
    sessionsPlayed,
    roundsCompleted,
    roleCounts.size,
  );

  return {
    profile: user,
    stats,
    proficiencyStars,
    badges,
    learningProgress,
  };
}