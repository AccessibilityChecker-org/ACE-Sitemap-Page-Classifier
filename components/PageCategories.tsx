'use client'

import type { AnalysisResult, CategoryGroup } from '@/types'

interface Props {
  analysis: AnalysisResult
}

const CATEGORY_COLORS: Record<string, { dot: string; bg: string; text: string; pillBg: string; pillText: string }> = {
  'Product Pages':            { dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Collection Pages':         { dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Blog Posts':               { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Static Pages':             { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', pillBg: 'bg-amber-100', pillText: 'text-amber-700' },
  'Homepage':                 { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', pillBg: 'bg-amber-100', pillText: 'text-amber-700' },
  'Blog Index':               { dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', pillBg: 'bg-amber-100', pillText: 'text-amber-700' },
  'Category Pages':           { dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Search Pages':             { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-600', pillBg: 'bg-red-100', pillText: 'text-red-700' },
  'Account Pages':            { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', pillBg: 'bg-red-100', pillText: 'text-red-700' },
  'Checkout / Cart Pages':    { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', pillBg: 'bg-red-100', pillText: 'text-red-700' },
  'Policy / Legal Pages':     { dot: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', pillBg: 'bg-amber-100', pillText: 'text-amber-700' },
  'Help Center / Docs Pages': { dot: 'bg-lime-500', bg: 'bg-lime-50', text: 'text-lime-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Landing Pages':            { dot: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Brand Pages':              { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Plant / Database Pages':   { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', pillBg: 'bg-green-100', pillText: 'text-green-700' },
  'Other':                    { dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600', pillBg: 'bg-gray-100', pillText: 'text-gray-600' },
}

function getColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Other']
}

function getPillStyle(group: CategoryGroup) {
  const colors = getColor(group.category)
  if (group.isFamilyGroup) {
    return { bg: 'bg-blue-100', text: 'text-blue-700' }
  }
  if (group.templateCount > 0) {
    return { bg: 'bg-green-100', text: 'text-green-700' }
  }
  if (group.dynamicCount > 0) {
    return { bg: 'bg-red-100', text: 'text-red-700' }
  }
  return { bg: colors.pillBg, text: colors.pillText }
}

export default function PageCategories({ analysis }: Props) {
  const totalRaw = analysis.rawPageCount

  return (
    <div className="ace-panel">
      <div className="flex items-baseline gap-5 mb-6">
        <div className="ace-num">4</div>
        <div className="flex flex-col gap-0.5">
          <span className="ace-section-kicker">Section 4</span>
          <h2 className="ace-title">Page Categories</h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {analysis.categories.length} categories
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Category</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Type</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Raw Count</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 pr-4">Weighted</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">% of Site</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {analysis.categories.map((group) => {
              const colors = getColor(group.category)
              const pillStyle = getPillStyle(group)
              const barWidth = totalRaw > 0 ? Math.max((group.rawCount / totalRaw) * 100, 0.5) : 0

              return (
                <tr key={group.category} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${colors.dot}`} />
                      <span className="font-medium text-gray-800 text-xs">{group.category}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${pillStyle.bg} ${pillStyle.text}`}
                    >
                      {group.typeLabel}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${colors.dot} rounded-full`}
                          style={{ width: `${Math.min(barWidth, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900 text-xs tabular-nums">
                        {group.rawCount.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-bold text-green-700 text-xs tabular-nums">
                      {group.weightedCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-gray-500 text-xs tabular-nums">
                      {group.percentOfSite.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200">
              <td colSpan={2} className="py-2.5 text-xs font-bold text-gray-700">Total</td>
              <td className="py-2.5 text-right text-xs font-bold text-gray-900 pr-4 tabular-nums">
                {analysis.rawPageCount.toLocaleString()}
              </td>
              <td className="py-2.5 text-right text-xs font-bold text-green-700 pr-4 tabular-nums">
                {analysis.weightedPageCount.toLocaleString()}
              </td>
              <td className="py-2.5 text-right text-xs font-bold text-gray-700">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Weight reduction callout */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="text-xs text-green-700">
          <span className="font-semibold">
            {analysis.rawPageCount.toLocaleString()} raw pages
          </span>{' '}
          reduce to{' '}
          <span className="font-bold text-green-800">
            {analysis.weightedPageCount.toLocaleString()} weighted pages
          </span>{' '}
          &mdash;{' '}
          <span className="font-semibold">
            {analysis.rawPageCount > 0
              ? Math.round((1 - analysis.weightedPageCount / analysis.rawPageCount) * 100)
              : 0}% reduction
          </span>{' '}
          using template weighting
        </div>
      </div>
    </div>
  )
}
