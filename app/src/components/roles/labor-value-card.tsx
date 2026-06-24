import { Card, CardContent } from "@/components/ui/card";
import { PRODUCTIVITY_PROFILES } from "@/lib/scenario";
import { unitValueVnd } from "@/lib/economy";
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
  const verdict =
    state.individualUnitCostVnd < social
      ? { text: "Lợi thế chi phí", tone: "text-success" }
      : state.individualUnitCostVnd > social
        ? { text: "Bất lợi chi phí", tone: "text-danger" }
        : { text: "Ngang giá trị xã hội", tone: "text-muted-foreground" };

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-3 p-4 text-sm">
        <Metric label="Hồ sơ" value={PRODUCTIVITY_PROFILES[state.profile].label} />
        <Metric label="Hao phí cá biệt" value={`${state.individualLaborTime} đơn vị`} />
        <Metric label="Chi phí/thùng" value={formatThousandDong(state.individualUnitCostVnd)} />
        <Metric label="Giá trị xã hội" value={formatThousandDong(social)} />
        <div className="col-span-2">
          <span className={`text-sm font-medium ${verdict.tone}`}>{verdict.text}</span>
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
