// Per-round role-specific state stored as RoleState.state JSON.

import type { ProductivityProfile } from "@/generated/prisma/enums";

export interface ProducerRoundState {
  kind: "PRODUCER";
  scenarioVersion?: string;
  profile: ProductivityProfile;
  /** User-facing simple rule: max buckets this supplier can make this round. */
  productionCapacity?: number;
  /** User-facing simple rule: cost for one bucket. */
  unitCostVnd?: number;
  /** Legacy/SRS explanation fields kept for old sessions and learning details. */
  individualLaborTime: number;
  individualUnitCostVnd: number;
  availableLaborPoints: number;
  productionCap: number;
  producedQuantity: number;
  pendingUpgrade: ProductivityProfile | null;
  techSupportActive?: boolean;
}

export interface ConsumerRoundState {
  kind: "CONSUMER";
  needTarget: number;
  fulfilledUnits: number;
  retailSpendingVnd: number;
  reservedOfferVnd: number;
  /** Exact total demand when INFO_DISCLOSURE policy applied (SRS §5.10). */
  exactDemandRevealed?: boolean;
}

export interface IntermediaryRoundState {
  kind: "INTERMEDIARY";
  connectedProducerIds: string[];
  connectedConsumerIds: string[];
  spoiledQuantity: number;
}

export interface GovernmentRoundState {
  kind: "GOVERNMENT";
  policyUsed: boolean;
  policySpendVnd: number;
  exportPromotion?: boolean;
  infoDisclosure?: boolean;
}

export type AnyRoleState =
  | ProducerRoundState
  | ConsumerRoundState
  | IntermediaryRoundState
  | GovernmentRoundState;
