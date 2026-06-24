// Government policy actions (SRS §5.10). One policy per round from round 2.

import type { PolicyType, RoundPhase } from "@/generated/prisma/enums";
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
  const targetIds = input.targetIds ?? [];
  let exportPurchased = 0;

  switch (input.policyType) {
    case "INFO_DISCLOSURE":
      fixedCostVnd = POLICIES.INFO_DISCLOSURE.fixedCostVnd;
      break;
    case "COLD_STORAGE": {
      const cfg = POLICIES.COLD_STORAGE;
      let units = 0;
      for (const lotId of targetIds.slice(0, cfg.maxUnits)) {
        const lot = await tx.inventoryLot.findUnique({ where: { id: lotId } });
        if (!lot || lot.availableQuantity <= 0) continue;
        const protect = Math.min(lot.availableQuantity, cfg.maxUnits - units);
        if (protect <= 0) break;
        await tx.inventoryLot.update({
          where: { id: lotId },
          data: { protectionState: "PROTECTED" },
        });
        units += protect;
      }
      if (units === 0) throw new ApiError("INVALID_POLICY", 422);
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
