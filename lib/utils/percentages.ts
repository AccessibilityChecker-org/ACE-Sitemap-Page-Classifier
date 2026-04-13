/**
 * Largest Remainder (Hamilton's) method for rounding percentages so that
 * the displayed values always sum to exactly 100% at the given precision.
 *
 * Steps:
 *   1. Compute each value's exact percentage share.
 *   2. Floor every percentage at the requested precision.
 *   3. Distribute the leftover percentage points (one unit at a time) to the
 *      entries with the largest fractional remainders until the total is 100.
 *
 * @param values   Raw numeric inputs (e.g. category counts).
 * @param decimals Number of decimal places to keep in the output. Default 0.
 * @returns        Array of percentages, aligned with `values`, summing to 100
 *                 at the given precision. Returns all zeros if the total is 0.
 */
export function largestRemainderPercentages(values: number[], decimals = 0): number[] {
  const n = values.length
  if (n === 0) return []

  const total = values.reduce((sum, v) => sum + (v > 0 ? v : 0), 0)
  if (total <= 0) return values.map(() => 0)

  const scale = Math.pow(10, decimals)
  const target = 100 * scale // integer representation of 100% at this precision

  // Exact share scaled to integer units (e.g. tenths for decimals=1).
  const exact = values.map((v) => ((v > 0 ? v : 0) / total) * target)
  const floors = exact.map((e) => Math.floor(e))
  const floorSum = floors.reduce((a, b) => a + b, 0)
  let remaining = target - floorSum

  // Rank indices by fractional remainder, largest first. Stable on ties via
  // original index order to keep output deterministic.
  const ranked = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => (b.frac - a.frac) || (a.i - b.i))

  const result = floors.slice()
  let k = 0
  while (remaining > 0 && ranked.length > 0) {
    result[ranked[k % ranked.length].i] += 1
    remaining -= 1
    k += 1
  }

  return result.map((v) => v / scale)
}
