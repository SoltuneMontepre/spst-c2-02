// Per-round role-specific state stored as RoleState.state JSON.

import type { ProductivityProfile } from "@/generated/prisma/enums";

export interface ProducerRoundState {
  kind: "PRODUCER";
  profile: ProductivityProfile;
  individualLaborTime: number;
  individualUnitCostVnd: number;
  availableLaborPoints: number;
  productionCap: number;
  producedQuantity: number;
  pendingUpgrade: ProductivityProfile | null;
}

export interface ConsumerRoundState {
  kind: "CONSUMER";
  needTarget: number;
  fulfilledUnits: number;
  retailSpendingVnd: number;
}

export interface IntermediaryRoundState {
  kind: "INTERMEDIARY";
  connectedProducerIds: string[];
  connectedConsumerIds: string[];
}

export interface GovernmentRoundState {
  kind: "GOVERNMENT";
  policyUsed: boolean;
  policySpendVnd: number;
}

export type AnyRoleState =
  | ProducerRoundState
  | ConsumerRoundState
  | IntermediaryRoundState
  | GovernmentRoundState;
