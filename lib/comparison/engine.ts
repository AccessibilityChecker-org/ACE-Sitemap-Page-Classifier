import type {
  AnalysisSnapshot,
  ComparisonResult,
  CategoryComparison,
} from '@/types'

/**
 * Compute a full diff between two analysis snapshots.
 * snapshotA = baseline ("before"), snapshotB = improved ("after").
 */
export function compareSnapshots(
  snapshotA: AnalysisSnapshot,
  snapshotB: AnalysisSnapshot
): ComparisonResult {
  const catMapA = new Map(
    snapshotA.analysis.categories.map((c) => [c.category, c])
  )
  const catMapB = new Map(
    snapshotB.analysis.categories.map((c) => [c.category, c])
  )

  // Union of all category names from both snapshots
  const allCategories = new Set([...catMapA.keys(), ...catMapB.keys()])

  const categoryComparisons: CategoryComparison[] = []
  for (const cat of allCategories) {
    const a = catMapA.get(cat)
    const b = catMapB.get(cat)
    categoryComparisons.push({
      category: cat,
      rawCountA:       a?.rawCount      ?? 0,
      rawCountB:       b?.rawCount      ?? 0,
      rawCountDiff:    (b?.rawCount      ?? 0) - (a?.rawCount      ?? 0),
      weightedCountA:  a?.weightedCount ?? 0,
      weightedCountB:  b?.weightedCount ?? 0,
      weightedCountDiff: (b?.weightedCount ?? 0) - (a?.weightedCount ?? 0),
      onlyInA: a !== undefined && b === undefined,
      onlyInB: a === undefined && b !== undefined,
    })
  }

  const recA = snapshotA.recommendation
  const recB = snapshotB.recommendation
  const weightReductionA = recA.weightReductionPercent
  const weightReductionB = recB.weightReductionPercent

  return {
    snapshotA,
    snapshotB,
    rawCountDiff:         snapshotB.analysis.rawPageCount - snapshotA.analysis.rawPageCount,
    weightedCountDiff:    snapshotB.analysis.weightedPageCount - snapshotA.analysis.weightedPageCount,
    weightReductionDiff:  weightReductionB - weightReductionA,
    planChanged:          recA.weightedPlan?.name !== recB.weightedPlan?.name,
    planNameA:            recA.weightedPlan?.name ?? null,
    planNameB:            recB.weightedPlan?.name ?? null,
    monthlyPriceDiff:     recB.monthlyPrice - recA.monthlyPrice,
    annualSavingsDiff:    recB.annualSavings - recA.annualSavings,
    categoryComparisons,
  }
}

/**
 * Return the top N category comparisons sorted by absolute weighted-count diff,
 * descending. Useful for "most changed" callouts.
 */
export function topChangedCategories(
  comparisons: CategoryComparison[],
  n: number
): CategoryComparison[] {
  return [...comparisons]
    .sort((a, b) => Math.abs(b.weightedCountDiff) - Math.abs(a.weightedCountDiff))
    .slice(0, n)
}
