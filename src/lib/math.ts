export function clampInt(v: string, min: number, max: number) {
  const n = Number.parseInt(v || "0", 10);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function clampNum(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
