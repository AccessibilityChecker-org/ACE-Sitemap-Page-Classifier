'use client'

import { useState, useMemo } from 'react'
import { X, ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { AnalysisSnapshot } from '@/types'
import { compareSnapshots, topChangedCategories } from '@/lib/comparison/engine'

interface Props {
  snapshots: AnalysisSnapshot[]
  onClose: () => void
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function DiffBadge({ diff, invert = false }: { diff: number; invert?: boolean }) {
  if (diff === 0) return <span className="text-xs text-gray-400 font-medium">no change</span>
  // "invert" means lower is better (e.g. weighted pages)
  const isGood = invert ? diff < 0 : diff > 0
  const color  = isGood ? 'text-green-600' : 'text-red-500'
  const Icon   = diff < 0 ? TrendingDown : TrendingUp
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon size={11} />
      {diff > 0 ? '+' : ''}{diff.toLocaleString()}
    </span>
  )
}

function PctDiffBadge({ diff, invert = false }: { diff: number; invert?: boolean }) {
  if (Math.abs(diff) < 0.05) return <span className="text-xs text-gray-400 font-medium">no change</span>
  const isGood = invert ? diff < 0 : diff > 0
  const color  = isGood ? 'text-green-600' : 'text-red-500'
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {diff > 0 ? '+' : ''}{diff.toFixed(1)}pp
    </span>
  )
}

export default function ComparisonView({ snapshots, onClose }: Props) {
  const [selectedA, setSelectedA] = useState<string>(snapshots[0]?.id ?? '')
  const [selectedB, setSelectedB] = useState<string>(snapshots[1]?.id ?? '')

  const snapA = snapshots.find((s) => s.id === selectedA) ?? null
  const snapB = snapshots.find((s) => s.id === selectedB) ?? null

  const result = useMemo(() => {
    if (!snapA || !snapB) return null
    return compareSnapshots(snapA, snapB)
  }, [snapA, snapB])

  const topChanged = result ? topChangedCategories(result.categoryComparisons, 1)[0] : null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white">
        <div>
          <h2 className="font-bold text-sm">Side-by-Side Comparison</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Compare two saved snapshots to validate classifier improvements
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Snapshot selectors */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Snapshot A — Baseline
            </label>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">— Select baseline —</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedB}>
                  {s.name} ({s.analysis.domain}, {s.analysis.weightedPageCount.toLocaleString()} pages)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Snapshot B — Improved
            </label>
            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">— Select improved —</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === selectedA}>
                  {s.name} ({s.analysis.domain}, {s.analysis.weightedPageCount.toLocaleString()} pages)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Guard: both must be selected */}
        {(!snapA || !snapB || !result) && (
          <p className="text-sm text-gray-400 text-center py-6">
            Select two snapshots above to see the comparison.
          </p>
        )}

        {result && (
          <>
            {/* KPI diff row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Raw Pages',
                  valA: result.snapshotA.analysis.rawPageCount.toLocaleString(),
                  valB: result.snapshotB.analysis.rawPageCount.toLocaleString(),
                  badge: <DiffBadge diff={result.rawCountDiff} invert />,
                },
                {
                  label: 'Weighted Pages',
                  valA: result.snapshotA.analysis.weightedPageCount.toLocaleString(),
                  valB: result.snapshotB.analysis.weightedPageCount.toLocaleString(),
                  badge: <DiffBadge diff={result.weightedCountDiff} invert />,
                },
                {
                  label: 'Weight Reduction',
                  valA: result.snapshotA.recommendation.weightReductionPercent.toFixed(1) + '%',
                  valB: result.snapshotB.recommendation.weightReductionPercent.toFixed(1) + '%',
                  badge: <PctDiffBadge diff={result.weightReductionDiff} />,
                },
                {
                  label: 'Annual Savings',
                  valA: fmt(result.snapshotA.recommendation.annualSavings),
                  valB: fmt(result.snapshotB.recommendation.annualSavings),
                  badge: <DiffBadge diff={result.annualSavingsDiff} />,
                },
              ].map(({ label, valA, valB, badge }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm text-gray-500">{valA}</span>
                    <ArrowRight size={10} className="text-gray-300" />
                    <span className="text-sm font-bold text-gray-900">{valB}</span>
                  </div>
                  <div className="mt-1">{badge}</div>
                </div>
              ))}
            </div>

            {/* Plan change callout */}
            {result.planChanged && (
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                result.monthlyPriceDiff < 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className={`w-1 self-stretch rounded-full ${
                  result.monthlyPriceDiff < 0 ? 'bg-green-500' : 'bg-amber-500'
                }`} />
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wide ${
                    result.monthlyPriceDiff < 0 ? 'text-green-700' : 'text-amber-700'
                  }`}>
                    Plan Changed
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    <span className="font-medium">{result.planNameA ?? 'Custom'}</span>
                    {' → '}
                    <span className="font-bold">{result.planNameB ?? 'Custom'}</span>
                    {result.monthlyPriceDiff !== 0 && (
                      <span className={`ml-2 text-xs font-semibold ${
                        result.monthlyPriceDiff < 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        ({result.monthlyPriceDiff > 0 ? '+' : ''}{fmt(result.monthlyPriceDiff)}/mo)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Top changed category callout */}
            {topChanged && Math.abs(topChanged.weightedCountDiff) > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-sm text-indigo-800">
                <span className="font-bold">Biggest shift:</span>{' '}
                <span className="font-medium">{topChanged.category}</span>
                {' changed by '}
                <span className="font-bold">
                  {topChanged.weightedCountDiff > 0 ? '+' : ''}
                  {topChanged.weightedCountDiff.toLocaleString()} weighted pages
                </span>
                {topChanged.weightedCountDiff < 0
                  ? ' (template detection improved for this family)'
                  : ' (more unique pages classified in this family)'}
              </div>
            )}

            {/* Category comparison table */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Category Breakdown
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 py-2 px-3">Category</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-2">A Raw</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-2">B Raw</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-2">Δ Raw</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-2">A Wtd</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-2">B Wtd</th>
                      <th className="text-right text-xs font-semibold text-gray-500 py-2 px-3">Δ Wtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...result.categoryComparisons]
                      .sort((a, b) => Math.abs(b.weightedCountDiff) - Math.abs(a.weightedCountDiff))
                      .map((cat) => (
                        <tr key={cat.category} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2 px-3">
                            <span className="text-gray-800 font-medium text-xs">{cat.category}</span>
                            {cat.onlyInA && (
                              <span className="ml-1.5 text-xs px-1 py-0.5 bg-red-100 text-red-600 rounded font-medium">Removed</span>
                            )}
                            {cat.onlyInB && (
                              <span className="ml-1.5 text-xs px-1 py-0.5 bg-green-100 text-green-600 rounded font-medium">New</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-xs text-gray-500">{cat.rawCountA.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-xs text-gray-700 font-medium">{cat.rawCountB.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right">
                            {cat.rawCountDiff === 0 ? (
                              <Minus size={10} className="text-gray-300 ml-auto" />
                            ) : (
                              <span className={`text-xs font-semibold ${cat.rawCountDiff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {cat.rawCountDiff > 0 ? '+' : ''}{cat.rawCountDiff.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-xs text-gray-500">{cat.weightedCountA.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-xs text-gray-700 font-medium">{cat.weightedCountB.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            {cat.weightedCountDiff === 0 ? (
                              <Minus size={10} className="text-gray-300 ml-auto" />
                            ) : (
                              <span className={`text-xs font-semibold ${cat.weightedCountDiff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {cat.weightedCountDiff > 0 ? '+' : ''}{cat.weightedCountDiff.toLocaleString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary note */}
            <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
              <span className="font-semibold text-green-600">Green Δ</span> = reduction in pages (better / more accurate template detection).{' '}
              <span className="font-semibold text-red-500">Red Δ</span> = increase (more pages classified, or classification broadened).
            </div>
          </>
        )}
      </div>
    </div>
  )
}
