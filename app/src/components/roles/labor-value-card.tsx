import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTIVITY_PROFILES } from "@/lib/scenario";
import {
  producerProductionCapacity,
  producerUnitCostVnd,
  unitValueVnd,
} from "@/lib/economy";
import { formatThousandDong } from "@/lib/money";
import type { ProducerRoundState } from "@/lib/role-state";

export function LaborValueCard({
  state,
  round,
}: {
  state: ProducerRoundState;
  round: number;
}) {
  const social = unitValueVnd(round);
  const unitCost = producerUnitCostVnd(state);
  const capacity = producerProductionCapacity(state);
  const verdict =
    unitCost < social
      ? { text: "Lợi thế chi phí", tone: "text-success" }
      : unitCost > social
        ? { text: "Bất lợi chi phí", tone: "text-danger" }
        : { text: "Ngang giá trị chuẩn", tone: "text-muted-foreground" };

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
        <Metric label="Hồ sơ" value={PRODUCTIVITY_PROFILES[state.profile].label} />
        <Metric label="Sức sản xuất" value={`${capacity} thùng/vòng`} />
        <Metric label="Chi phí/thùng" value={formatThousandDong(unitCost)} />
        <Metric label="Giá trị chuẩn" value={formatThousandDong(social)} />
        <div className="col-span-2">
          <span className={`text-sm font-medium ${verdict.tone}`}>{verdict.text}</span>
          <p className="mt-1 text-xs text-muted-foreground">
            Giải thích thêm: chi phí này tương ứng với {state.individualLaborTime} điểm
            lao động trong bài học.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
