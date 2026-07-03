import type { LiveRoundStats, RoundAnalytics } from "@/lib/session-service";

const W = 620;
const H = 210;
const PAD_X = 48;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;
const PRESSURE_ARROW_PX = 30;

function compactVnd(amountVnd: number): string {
  const thousands = amountVnd / 1000;
  const text = Number.isInteger(thousands)
    ? thousands.toString()
    : thousands.toFixed(1);
  return `${text}k`;
}

function pressureDirection(round: RoundAnalytics): -1 | 0 | 1 {
  if (round.demandQuantity > round.supplyQuantity) return 1;
  if (round.demandQuantity < round.supplyQuantity) return -1;
  return 0;
}

function pressureLabel(round: RoundAnalytics): string {
  const direction = pressureDirection(round);
  if (direction > 0) return "Cầu > Cung";
  if (direction < 0) return "Cung > Cầu";
  return "Cung = Cầu";
}

/** Two-line chart: social value (anchor) vs market price (SRS §5.9, UI-OBSERVATORY-01). */
export function PriceValueChart({
  rounds,
  liveStats,
  currentRound,
}: {
  rounds: RoundAnalytics[];
  liveStats?: LiveRoundStats | null;
  currentRound?: number;
}) {
  if (rounds.length === 0 && !liveStats) {
    return (
      <div className="flex min-h-[190px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          Biểu đồ xuất hiện khi chợ mở và có dữ liệu giá.
        </p>
      </div>
    );
  }

  const displayRounds = [...rounds];
  const finalRoundExists =
    liveStats != null &&
    currentRound != null &&
    displayRounds.some((round) => round.number === currentRound);

  if (liveStats && !finalRoundExists) {
    displayRounds.push({
      number: currentRound ?? rounds.length + 1,
      unitValueVnd: liveStats.unitValueVnd,
      marketPriceVnd: liveStats.marketPriceVnd,
      supplyQuantity: liveStats.supplyQuantity,
      demandQuantity: liveStats.demandQuantity,
      retailSoldQuantity: 0,
      spoiledQuantity: 0,
    });
  }

  // Prepend the pre-trading anchor so a round's trajectory (start → close)
  // is visible — N completed rounds otherwise only plot N points, hiding
  // the "where did it start from" mark players expect (SRS §5.9).
  const points: (RoundAnalytics & { label: string })[] =
    displayRounds.length > 0
      ? [
          {
            ...displayRounds[0],
            number: displayRounds[0].number - 1,
            marketPriceVnd: displayRounds[0].unitValueVnd,
            supplyQuantity: 0,
            demandQuantity: 0,
            retailSoldQuantity: 0,
            spoiledQuantity: 0,
            label: "Bắt đầu",
          },
          ...displayRounds.map((round) => ({ ...round, label: `V${round.number}` })),
        ]
      : [];

  const values = points.flatMap((round) => [
    round.unitValueVnd,
    round.marketPriceVnd ?? round.unitValueVnd,
  ]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(4000, rawMax - rawMin);
  const minVnd = Math.max(0, Math.floor((rawMin - spread * 0.25) / 1000) * 1000);
  const maxVnd = Math.ceil((rawMax + spread * 0.25) / 1000) * 1000;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const x = (i: number) =>
    PAD_X + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
  const y = (v: number) =>
    PAD_TOP + ((maxVnd - v) / Math.max(1, maxVnd - minVnd)) * innerH;

  const yTicks = [maxVnd, Math.round((maxVnd + minVnd) / 2000) * 1000, minVnd];
  const valueLine = points
    .map((round, i) => `${x(i)},${y(round.unitValueVnd)}`)
    .join(" ");
  const pricePoints = points
    .map((round, i) =>
      round.marketPriceVnd == null ? null : `${x(i)},${y(round.marketPriceVnd)}`,
    )
    .filter((point): point is string => Boolean(point))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full min-h-[190px] w-full"
      role="img"
      aria-label="Giá trị và giá thị trường"
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD_X}
            y1={y(tick)}
            x2={W - PAD_X}
            y2={y(tick)}
            stroke="var(--border)"
            strokeDasharray="4 4"
            opacity={0.8}
          />
          <text
            x={PAD_X - 10}
            y={y(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill="var(--muted-foreground)"
          >
            {compactVnd(tick)}
          </text>
        </g>
      ))}

      <polyline
        points={valueLine}
        fill="none"
        stroke="var(--value)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />

      {pricePoints ? (
        <polyline
          points={pricePoints}
          fill="none"
          stroke="var(--price)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
      ) : null}

      {points.map((round, i) => {
        const direction = pressureDirection(round);
        const anchorY = y(round.unitValueVnd);
        const tipY = Math.max(
          PAD_TOP + 16,
          Math.min(H - PAD_BOTTOM - 16, anchorY - direction * PRESSURE_ARROW_PX),
        );
        const labelY = direction >= 0 ? tipY - 8 : tipY + 13;

        return (
          <g key={`${round.number}-${i}`}>
            {round.marketPriceVnd != null ? (
              <circle
                cx={x(i)}
                cy={y(round.marketPriceVnd)}
                r={4}
                fill="var(--price)"
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ) : round.supplyQuantity > 0 || round.demandQuantity > 0 ? (
              <g aria-label={`${pressureLabel(round)}: áp lực giá, chưa phải giá giao dịch`}>
                <circle
                  cx={x(i)}
                  cy={anchorY}
                  r={4}
                  fill="var(--surface)"
                  stroke="var(--price)"
                  strokeWidth={2}
                />
                {direction !== 0 ? (
                  <>
                    <line
                      x1={x(i)}
                      y1={anchorY + (direction > 0 ? -5 : 5)}
                      x2={x(i)}
                      y2={tipY}
                      stroke="var(--price)"
                      strokeDasharray="3 3"
                      strokeWidth={2}
                    />
                    <path
                      d={
                        direction > 0
                          ? `M ${x(i) - 4} ${tipY + 5} L ${x(i)} ${tipY} L ${x(i) + 4} ${tipY + 5}`
                          : `M ${x(i) - 4} ${tipY - 5} L ${x(i)} ${tipY} L ${x(i) + 4} ${tipY - 5}`
                      }
                      fill="none"
                      stroke="var(--price)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </>
                ) : null}
                <text
                  x={x(i)}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill="var(--price)"
                >
                  {pressureLabel(round)}
                </text>
              </g>
            ) : null}
            <text
              x={x(i)}
              y={H - 10}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {round.label}
            </text>
          </g>
        );
      })}

      <text
        x={W - PAD_X}
        y={y(points[points.length - 1]?.unitValueVnd ?? maxVnd)}
        fontSize={11}
        fill="var(--value)"
        textAnchor="end"
        dy={-6}
      >
        GT {compactVnd(points[points.length - 1]?.unitValueVnd ?? maxVnd)}
      </text>
    </svg>
  );
}
