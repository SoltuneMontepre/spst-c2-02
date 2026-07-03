// Government policy actions (SRS §5.10). One policy per round from round 2.

import type { InventoryStatus, PolicyType, Role, RoundPhase } from "@/generated/prisma/enums";
import { ApiError } from "./api";
import type { Tx, CommandContext } from "./commands";
import { POLICIES, PRODUCER_INPUT_LOCK_SEC, PHASE_DURATIONS_SEC } from "./scenario";
import type {
  GovernmentRoundState,
  ProducerRoundState,
  ConsumerRoundState,
} from "./role-state";
import { executeSystemExport } from "./export-service";

function requirePhase(ctx: CommandContext, phase: RoundPhase): void {
  if (ctx.session.phase !== phase) throw new ApiError("WRONG_PHASE", 409);
}

async function currentRound(tx: Tx, sessionId: string, number: number) {
  return tx.round.findUniqueOrThrow({
    where: { sessionId_number: { sessionId, number } },
  });
}

type ColdStorageLot = {
  id: string;
  sessionId: string;
  roundIdProduced: string;
  ownerParticipantId: string;
  quantity: number;
  availableQuantity: number;
  status: InventoryStatus;
  unitCostVnd: number;
};

async function findColdStorageLots(
  tx: Tx,
  sessionId: string,
  targetIds: string[],
): Promise<ColdStorageLot[]> {
  const eligibleStatuses: InventoryStatus[] = ["AVAILABLE", "CARRIED"];
  const eligibleOwnerRoles: Role[] = ["PRODUCER", "INTERMEDIARY"];
  const where = {
    sessionId,
    availableQuantity: { gt: 0 },
    protectionState: "NONE" as const,
    status: { in: eligibleStatuses },
    owner: { role: { in: eligibleOwnerRoles } },
  };

  if (targetIds.length === 0) {
    return tx.inventoryLot.findMany({
      where,
      orderBy: [{ availableQuantity: "desc" }, { createdAt: "asc" }],
      take: POLICIES.COLD_STORAGE.maxUnits,
      select: {
        id: true,
        sessionId: true,
        roundIdProduced: true,
        ownerParticipantId: true,
        quantity: true,
        availableQuantity: true,
        status: true,
        unitCostVnd: true,
      },
    });
  }

  const lots = await tx.inventoryLot.findMany({
    where: { ...where, id: { in: targetIds } },
    select: {
      id: true,
      sessionId: true,
      roundIdProduced: true,
      ownerParticipantId: true,
      quantity: true,
      availableQuantity: true,
      status: true,
      unitCostVnd: true,
    },
  });
  const lotById = new Map(lots.map((lot) => [lot.id, lot]));
  return targetIds
    .map((id) => lotById.get(id))
    .filter((lot): lot is (typeof lots)[number] => Boolean(lot));
}

async function protectColdStorageUnits(
  tx: Tx,
  lot: ColdStorageLot,
  quantity: number,
): Promise<string> {
  if (quantity === lot.quantity && quantity === lot.availableQuantity) {
    await tx.inventoryLot.update({
      where: { id: lot.id },
      data: { protectionState: "PROTECTED" },
    });
    return lot.id;
  }

  await tx.inventoryLot.update({
    where: { id: lot.id },
    data: {
      quantity: { decrement: quantity },
      availableQuantity: { decrement: quantity },
    },
  });
  const protectedLot = await tx.inventoryLot.create({
    data: {
      sessionId: lot.sessionId,
      roundIdProduced: lot.roundIdProduced,
      ownerParticipantId: lot.ownerParticipantId,
      quantity,
      availableQuantity: quantity,
      status: lot.status,
      unitCostVnd: lot.unitCostVnd,
      protectionState: "PROTECTED",
    },
    select: { id: true },
  });
  return protectedLot.id;
}

function isExportWindow(ctx: CommandContext): boolean {
  if (ctx.session.phase !== "MARKET_OPEN" || !ctx.session.phaseEndsAt) return false;
  const windowMs = 15_000;
  const phaseStart =
    ctx.session.phaseEndsAt.getTime() - PHASE_DURATIONS_SEC.MARKET_OPEN * 1000;
  return Date.now() < phaseStart + windowMs;
}

/** Apply a state policy once per round (SRS §5.10). */
export async function applyPolicy(
  tx: Tx,
  ctx: CommandContext,
  input: { policyType: PolicyType; targetIds?: string[] },
): Promise<{ policyActionId: string; exportPurchased?: number }> {
  if (ctx.participant.role !== "GOVERNMENT") throw new ApiError("WRONG_ROLE", 403);
  if (ctx.session.currentRound < 2) throw new ApiError("POLICY_ROUND_FORBIDDEN", 422);

  const round = await currentRound(tx, ctx.session.id, ctx.session.currentRound);
  const rs = await tx.roleState.findUniqueOrThrow({
    where: { participantId_roundId: { participantId: ctx.participant.id, roundId: round.id } },
  });
  const gstate = rs.state as unknown as GovernmentRoundState;
  if (gstate.policyUsed) throw new ApiError("POLICY_ALREADY_USED", 409);

  const wallet = await tx.wallet.findUniqueOrThrow({
    where: { participantId: ctx.participant.id },
  });

  // "Không can thiệp" — valid, no cost.
  if (input.policyType === "NONE") {
    await tx.roleState.update({
      where: { id: rs.id },
      data: { state: { ...gstate, policyUsed: true } as never },
    });
    const action = await tx.policyAction.create({
      data: {
        roundId: round.id,
        stateParticipantId: ctx.participant.id,
        policyType: "NONE",
        targetIds: [],
        status: "APPLIED",
        appliedAt: new Date(),
      },
    });
    return { policyActionId: action.id };
  }

  const exportPolicy = input.policyType === "EXPORT_PROMOTION";
  if (exportPolicy) {
    requirePhase(ctx, "MARKET_OPEN");
    if (!isExportWindow(ctx)) throw new ApiError("WRONG_PHASE", 409);
  } else {
    requirePhase(ctx, "DECISION");
    if (input.policyType === "TECH_SUPPORT" && ctx.session.currentRound > 3) {
      throw new ApiError("INVALID_POLICY", 422);
    }
  }

  let fixedCostVnd = 0;
  let variableCostVnd = 0;
  let targetIds = input.targetIds ?? [];
  let exportPurchased = 0;

  switch (input.policyType) {
    case "INFO_DISCLOSURE":
      fixedCostVnd = POLICIES.INFO_DISCLOSURE.fixedCostVnd;
      break;
    case "COLD_STORAGE": {
      const cfg = POLICIES.COLD_STORAGE;
      let units = 0;
      const protectedTargetIds: string[] = [];
      const lots = await findColdStorageLots(tx, ctx.session.id, targetIds);
      for (const lot of lots) {
        const protect = Math.min(lot.availableQuantity, cfg.maxUnits - units);
        if (protect <= 0) break;
        const protectedLotId = await protectColdStorageUnits(tx, lot, protect);
        protectedTargetIds.push(protectedLotId);
        units += protect;
        if (units >= cfg.maxUnits) break;
      }
      if (units === 0) {
        throw new ApiError("INVALID_POLICY", 422, "Chưa có hàng tồn hợp lệ để bảo vệ bằng kho lạnh.");
      }
      targetIds = protectedTargetIds;
      variableCostVnd = units * cfg.perUnitCostVnd;
      break;
    }
    case "EXPORT_PROMOTION":
      fixedCostVnd = POLICIES.EXPORT_PROMOTION.fixedCostVnd;
      break;
    case "TECH_SUPPORT": {
      if (ctx.session.currentRound < 2 || ctx.session.currentRound > 3) {
        throw new ApiError("INVALID_POLICY", 422);
      }
      fixedCostVnd = POLICIES.TECH_SUPPORT.fixedCostVnd;
      const pid = targetIds[0];
      if (!pid) throw new ApiError("INVALID_POLICY", 422);
      const pRs = await tx.roleState.findUnique({
        where: { participantId_roundId: { participantId: pid, roundId: round.id } },
      });
      if (!pRs || pRs.role !== "PRODUCER") throw new ApiError("INVALID_POLICY", 422);
      const pstate = pRs.state as unknown as ProducerRoundState;
      await tx.roleState.update({
        where: { id: pRs.id },
        data: { state: { ...pstate, techSupportActive: true } as never },
      });
      break;
    }
    default:
      throw new ApiError("INVALID_POLICY", 422);
  }

  const totalCost = fixedCostVnd + variableCostVnd;
  if (wallet.balanceVnd < totalCost) throw new ApiError("INSUFFICIENT_FUNDS", 409);

  if (totalCost > 0) {
    await tx.wallet.update({
      where: { participantId: ctx.participant.id },
      data: { balanceVnd: { decrement: totalCost } },
    });
    await tx.ledgerEntry.create({
      data: {
        sessionId: ctx.session.id,
        roundId: round.id,
        walletId: wallet.id,
        type: "POLICY_COST",
        amountVnd: -totalCost,
      },
    });
  }

  const newState: GovernmentRoundState = {
    ...gstate,
    policyUsed: true,
    policySpendVnd: gstate.policySpendVnd + totalCost,
    exportPromotion: exportPolicy ? true : gstate.exportPromotion,
    infoDisclosure: input.policyType === "INFO_DISCLOSURE" ? true : gstate.infoDisclosure,
  };
  await tx.roleState.update({
    where: { id: rs.id },
    data: { state: newState as never },
  });

  // Reveal exact demand to all consumers (INFO_DISCLOSURE).
  if (input.policyType === "INFO_DISCLOSURE") {
    const consumers = await tx.roleState.findMany({
      where: { roundId: round.id, role: "CONSUMER" },
    });
    const totalDemand = consumers.reduce(
      (s, r) => s + (r.state as unknown as ConsumerRoundState).needTarget,
      0,
    );
    for (const cr of consumers) {
      const cstate = cr.state as unknown as ConsumerRoundState;
      await tx.roleState.update({
        where: { id: cr.id },
        data: {
          state: {
            ...cstate,
            exactDemandRevealed: true,
            needTarget: cstate.needTarget,
          } as never,
        },
      });
    }
    void totalDemand;
  }

  let extraSpend = 0;
  if (exportPolicy) {
    const result = await executeSystemExport(tx, {
      sessionId: ctx.session.id,
      roundId: round.id,
      roundNumber: ctx.session.currentRound,
      governmentId: ctx.participant.id,
      governmentWalletId: wallet.id,
    });
    exportPurchased = result.purchased;
    extraSpend = result.spentVnd;
    if (extraSpend > 0) {
      await tx.roleState.update({
        where: { id: rs.id },
        data: {
          state: {
            ...newState,
            policySpendVnd: newState.policySpendVnd + extraSpend,
          } as never,
        },
      });
    }
  }

  const action = await tx.policyAction.create({
    data: {
      roundId: round.id,
      stateParticipantId: ctx.participant.id,
      policyType: input.policyType,
      targetIds,
      fixedCostVnd,
      variableCostVnd: variableCostVnd + extraSpend,
      status: "APPLIED",
      appliedAt: new Date(),
    },
  });

  return { policyActionId: action.id, exportPurchased };
}
