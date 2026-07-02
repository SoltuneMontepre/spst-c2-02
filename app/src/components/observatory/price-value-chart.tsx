import type { LiveRoundStats, RoundAnalytics } from "@/lib/session-service";

const W = 320;
const H = 170;
const PAD = 34;

/** Two-line chart: social value (anchor) vs market price (SRS §5.9, UI-OBSERVATORY-01). */
export function PriceValueChart({
  rounds,
  liveStats,
}: {
  rounds: RoundAnalytics[];
  liveStats?: LiveRoundStats | null;
}) {
  if (rounds.length === 0 && !liveStats) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu vòng nào.
      </p>
    );
  }

  const displayRounds =
    rounds.length > 0
      ? rounds
      : liveStats
        ? [
            {
              number: 0,
              unitValueVnd: liveStats.unitValueVnd,
              marketPriceVnd: liveStats.marketPriceVnd,
              supplyQuantity: liveStats.supplyQuantity,
              demandQuantity: liveStats.demandQuantity,
              retailSoldQuantity: 0,
              spoiledQuantity: 0,
            },
          ]
        : [];

  const livePoint =
    liveStats && rounds.length > 0
      ? {
          unitValueVnd: liveStats.unitValueVnd,
          marketPriceVnd: liveStats.marketPriceVnd,
        }
      : null;

  const maxVnd = Math.max(
    12000,
    ...displayRounds.map((r) => Math.max(r.unitValueVnd, r.marketPriceVnd ?? 0)),
    livePoint?.marketPriceVnd ?? 0,
    livePoint?.unitValueVnd ?? 0,
  );
  const pointCount = displayRounds.length + (livePoint ? 1 : 0);
  const x = (i: number) =>
    PAD + (pointCount === 1 ? 0 : (i * (W - 2 * PAD)) / (pointCount - 1));
  const y = (v: number) => H - PAD - (v / maxVnd) * (H - 2 * PAD);

  const valueLine = displayRounds.map((r, i) => `${x(i)},${y(r.unitValueVnd)}`).join(" ");
  const priced = displayRounds
    .map((r, i) => ({ r, i }))
    .filter((p) => p.r.marketPriceVnd !== null);

  const liveIndex = displayRounds.length;
  const livePriceY = livePoint?.marketPriceVnd != null ? y(livePoint.marketPriceVnd) : null;
  const lastPricedIndex =
    priced.length > 0 ? priced[priced.length - 1].i : displayRounds.length > 0 ? 0 : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Giá trị và giá thị trường"
    >
      <text x={4} y={PAD} fontSize={9} fill="var(--muted-foreground)">
        VND
      </text>
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--border)" />
      <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="var(--border)" />

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

      {livePoint && livePriceY != null && lastPricedIndex != null ? (
        <line
          x1={x(lastPricedIndex)}
          y1={
            displayRounds[lastPricedIndex]?.marketPriceVnd != null
              ? y(displayRounds[lastPricedIndex].marketPriceVnd!)
              : y(livePoint.unitValueVnd)
          }
          x2={x(liveIndex)}
          y2={livePriceY}
          stroke="var(--price)"
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.85}
        />
      ) : null}

      {priced.map(({ r, i }) => (
        <circle
          key={`p-${r.number}`}
          cx={x(i)}
          cy={y(r.marketPriceVnd!)}
          r={4}
          fill="var(--price)"
        />
      ))}

      {livePoint && livePriceY != null ? (
        <circle cx={x(liveIndex)} cy={livePriceY} r={5} fill="var(--price)" opacity={0.9} />
      ) : null}

      {displayRounds.map((r, i) => (
        <text
          key={`t-${r.number}`}
          x={x(i)}
          y={H - PAD + 14}
          textAnchor="middle"
          fontSize={10}
          fill="var(--muted-foreground)"
        >
          V{r.number}
        </text>
      ))}

      {livePoint ? (
        <text
          x={x(liveIndex)}
          y={H - PAD + 14}
          textAnchor="middle"
          fontSize={10}
          fill="var(--primary)"
          fontWeight={600}
        >
          Live
        </text>
      ) : null}

      <text x={W - PAD} y={y(displayRounds[0]?.unitValueVnd ?? liveStats!.unitValueVnd)} fontSize={8} fill="var(--value)" textAnchor="end" dy={-4}>
        Chuẩn
      </text>
    </svg>
  );
}
