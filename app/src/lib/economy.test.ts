import { allowedProductionQuantity } from "./economy";

function assertEqual(name: string, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${expected}, received ${actual}`);
  }
}

assertEqual(
  "uses production capacity when wallet can afford more",
  allowedProductionQuantity({
    productionCapacity: 4,
    producedQuantity: 0,
    balanceVnd: 50000,
    unitCostVnd: 10000,
  }),
  4,
);

assertEqual(
  "uses wallet when money is the tighter limit",
  allowedProductionQuantity({
    productionCapacity: 4,
    producedQuantity: 0,
    balanceVnd: 25000,
    unitCostVnd: 10000,
  }),
  2,
);

assertEqual(
  "returns zero when production capacity is already used",
  allowedProductionQuantity({
    productionCapacity: 4,
    producedQuantity: 4,
    balanceVnd: 50000,
    unitCostVnd: 10000,
  }),
  0,
);
