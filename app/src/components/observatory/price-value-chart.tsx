import type { RoundAnalytics } from "@/lib/session-service";

const W = 320;
const H = 170;
const PAD = 34;

/** Two-line chart: social value (anchor) vs market price (SRS §5.9, UI-OBSERVATORY-01). */
export function PriceValueChart({ rounds }: { rounds: RoundAnalytics[] }) {
  if (rounds.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu vòng nào.
      </p>
    );
  }

  const maxVnd = Math.max(
    12000,
    ...rounds.map((r) => Math.max(r.unitValueVnd, r.marketPriceVnd ?? 0)),
  );
  const x = (i: number) =>
    PAD + (rounds.length === 1 ? 0 : (i * (W - 2 * PAD)) / (rounds.length - 1));
  const y = (v: number) => H - PAD - (v / maxVnd) * (H - 2 * PAD);

  const valueLine = rounds.map((r, i) => `${x(i)},${y(r.unitValueVnd)}`).join(" ");
  const priced = rounds
    .map((r, i) => ({ r, i }))
    .filter((p) => p.r.marketPriceVnd !== null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Giá trị và giá thị trường">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" />
      <polyline
        points={valueLine}
        fill="none"
        stroke="var(--value)"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      {priced.map(({ r, i }, k) =>
        k > 0 ? (
          <line
            key={`l-${r.number}`}
            x1={x(priced[k - 1].i)}
            y1={y(priced[k - 1].r.marketPriceVnd!)}
            x2={x(i)}
            y2={y(r.marketPriceVnd!)}
            stroke="var(--price)"
            strokeWidth={2}
          />
        ) : null,
      )}
      {priced.map(({ r, i }) => (
        <circle key={`p-${r.number}`} cx={x(i)} cy={y(r.marketPriceVnd!)} r={4} fill="var(--price)" />
      ))}
      {rounds.map((r, i) => (
        <text key={`t-${r.number}`} x={x(i)} y={H - PAD + 14} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">
          V{r.number}
        </text>
      ))}
    </svg>
  );
}
