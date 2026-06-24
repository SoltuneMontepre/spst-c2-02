// Money is stored as integer VND (TECH-MONEY). UI shows "nghìn Đồng".

/** Round to nearest 1.000 VND, half-up (SRS §5.2.2, §5.6). */
export function roundToThousandHalfUp(amountVnd: number): number {
  return Math.floor(amountVnd / 1000 + 0.5) * 1000;
}

/** "10 nghìn Đồng" — primary UI display. */
export function formatThousandDong(amountVnd: number): string {
  const thousands = amountVnd / 1000;
  const text = Number.isInteger(thousands)
    ? thousands.toString()
    : thousands.toFixed(1);
  return `${text} nghìn Đồng`;
}

/** "10.000 Đồng" — tooltip / detail display. */
export function formatFullDong(amountVnd: number): string {
  return `${amountVnd.toLocaleString("vi-VN")} Đồng`;
}

export const PRICE_STEP_VND = 1000;
export const MIN_PRICE_VND = 1000;
export const MAX_PRICE_VND = 30000;

/** Valid gameplay price: multiple of 1.000 within [1.000, 30.000]. */
export function isValidPriceVnd(amountVnd: number): boolean {
  return (
    Number.isInteger(amountVnd) &&
    amountVnd % PRICE_STEP_VND === 0 &&
    amountVnd >= MIN_PRICE_VND &&
    amountVnd <= MAX_PRICE_VND
  );
}
