/**
 * ETH values travel as decimal strings to preserve precision.
 * These helpers use BigInt arithmetic (via integer scaling) to avoid
 * floating-point drift in price/total calculations.
 */

const PRECISION = 18; // 18 decimal places (wei-level)
const SCALE = BigInt(10) ** BigInt(PRECISION);

function parse(value: string): bigint {
  const [intPart, fracPart = ""] = value.replace("-", "").split(".");
  const frac = fracPart.padEnd(PRECISION, "0").slice(0, PRECISION);
  const result = BigInt(intPart) * SCALE + BigInt(frac);
  return value.startsWith("-") ? -result : result;
}

function format(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const intPart = abs / SCALE;
  const fracPart = (abs % SCALE).toString().padStart(PRECISION, "0");
  // Trim trailing zeros but keep at least 2 decimal places for ETH display
  const trimmed = fracPart.replace(/0+$/, "").padEnd(2, "0");
  return `${negative ? "-" : ""}${intPart}.${trimmed}`;
}

export function addDecimals(a: string, b: string): string {
  return format(parse(a) + parse(b));
}

export function multiplyDecimal(a: string, b: number): string {
  // Multiply by integer-scaled b to avoid float imprecision
  const scaledB = Math.round(b * 1e6);
  return format((parse(a) * BigInt(scaledB)) / BigInt(1e6));
}

export function formatEth(value: string, decimals = 4): string {
  const num = parseFloat(value);
  return num.toFixed(decimals);
}
