// Pure economy engine (SRS §5). No I/O — deterministic, unit-testable.

import type { ProductivityProfile } from "@/generated/prisma/enums";
import { PRODUCTIVITY_PROFILES, SCENARIO } from "./scenario";
import { roundToThousandHalfUp } from "./money";

/** TGLĐXHCT for a round (SRS §5.7). */
export function socialLaborTime(roundNumber: number): number {
  return roundNumber >= 4
    ? SCENARIO.socialLaborTimeRound4
    : SCENARIO.socialLaborTimeRounds123;
}

/** Social unit value: c + TGLĐXHCT * laborRate (SRS §5.3). */
export function unitValueVnd(roundNumber: number): number {
  return (
    SCENARIO.inputTransferredValueVnd +
    socialLaborTime(roundNumber) * SCENARIO.laborValueRateVnd
  );
}

/** Individual cost from a profile's labor time (SRS §5.3). */
export function individualUnitCostVnd(profile: ProductivityProfile): number {
  return (
    SCENARIO.inputTransferredValueVnd +
    PRODUCTIVITY_PROFILES[profile].individualLaborTime * SCENARIO.laborValueRateVnd
  );
}

/** Round 4 forces everyone to laborTime=1; otherwise use the profile (SRS §5.4). */
export function effectiveLaborTime(
  profile: ProductivityProfile,
  roundNumber: number,
): number {
  if (roundNumber >= 4) return 1;
  return PRODUCTIVITY_PROFILES[profile].individualLaborTime;
}

/** Per-round labor points + production cap; round 2 scales both by 1.5, ceil (SRS §5.7). */
export function roundResources(roundNumber: number): {
  availableLaborPoints: number;
  productionCap: number;
} {
  if (roundNumber === 2) {
    return {
      availableLaborPoints: Math.ceil(SCENARIO.producerLaborPoints * 1.5),
      productionCap: Math.ceil(SCENARIO.roundProductionCap * 1.5),
    };
  }
  return {
    availableLaborPoints: SCENARIO.producerLaborPoints,
    productionCap: SCENARIO.roundProductionCap,
  };
}

/** Max quantity a producer may make this round (SRS §5.5). */
export function allowedProductionQuantity(params: {
  availableLaborPoints: number;
  individualLaborTime: number;
  productionCap: number;
  balanceVnd: number;
  individualUnitCostVnd: number;
}): number {
  const capacityByLabor = Math.floor(
    params.availableLaborPoints / params.individualLaborTime,
  );
  const capacityByFunds = Math.floor(
    params.balanceVnd / params.individualUnitCostVnd,
  );
  return Math.max(0, Math.min(capacityByLabor, params.productionCap, capacityByFunds));
}

export interface CompletedRetailTx {
  unitPriceVnd: number;
  quantity: number;
}

/** Weighted-average market price over completed retail transactions (SRS §5.6). */
export function computeMarketPrice(transactions: readonly CompletedRetailTx[]): {
  numeratorVndUnits: number;
  denominatorUnits: number;
  exactMarketPrice: number | null;
  marketPriceVnd: number | null;
} {
  let numerator = 0;
  let denominator = 0;
  for (const tx of transactions) {
    numerator += tx.unitPriceVnd * tx.quantity;
    denominator += tx.quantity;
  }
  if (denominator === 0) {
    return {
      numeratorVndUnits: 0,
      denominatorUnits: 0,
      exactMarketPrice: null,
      marketPriceVnd: null,
    };
  }
  const exact = numerator / denominator;
  return {
    numeratorVndUnits: numerator,
    denominatorUnits: denominator,
    exactMarketPrice: exact,
    marketPriceVnd: roundToThousandHalfUp(exact),
  };
}

// ───────────────────────── Scoring (SRS §5.9) ─────────────────────────

export function producerProfitVnd(endingBalanceVnd: number): number {
  return endingBalanceVnd - SCENARIO.producerStartingCapitalVnd;
}

export function consumerUtilityVnd(
  fulfilledRequiredUnits: number,
  totalRetailSpendingVnd: number,
): number {
  return (
    fulfilledRequiredUnits * SCENARIO.needFulfillmentUtilityVnd -
    totalRetailSpendingVnd
  );
}

export function intermediaryProfitVnd(endingBalanceVnd: number): number {
  return endingBalanceVnd - SCENARIO.intermediaryStartingCapitalVnd;
}

export function socialScore(params: {
  completedRetailQuantity: number;
  consumerFulfillmentRate: number; // 0..1
  spoiledQuantity: number;
  insolventProducerCount: number;
  policySpendVnd: number;
}): number {
  return (
    2 * params.completedRetailQuantity +
    Math.round(10 * params.consumerFulfillmentRate) -
    2 * params.spoiledQuantity -
    5 * params.insolventProducerCount -
    Math.floor(params.policySpendVnd / 1000)
  );
}
