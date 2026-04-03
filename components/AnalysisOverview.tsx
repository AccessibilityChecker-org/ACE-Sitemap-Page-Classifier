'use client'

import type { AnalysisResult } from '@/types'

interface Props {
  analysis: AnalysisResult
}

const COLORS = {
  template: { bg: 'bg-blue-500', text: 'text-blue-600', label: 'Template', light: 'bg-blue-50' },
  content: { bg: 'bg-green-500', text: 'text-green-600', label: 'Content', light: 'bg-green-50' },
  unique: { bg: 'bg-amber-500', text: 'text-amber-600', label: 'Unique', light: 'bg-amber-50' },
  dynamic: { bg: 'bg-red-500', text: 'text-red-500', label: 'Dynamic', light: 'bg-red-50' },
}

function formatNum(n: number): string {
  return n.toLocaleString()
}

export default function AnalysisOverview({ analysis }: Props) {
  const total = analysis.rawPageCount

  // Template count = number of template URLs
  const templateUrlCount = analysis.allClassifiedUrls.filter((u) => u.pageType === 'template').length
  const contentUrlCount = analysis.contentPagesCount
  const uniqueUrlCount = analysis.uniquePagesCount
  const dynamicUrlCount = analysis.dynamicPagesCount

  const barSegments = [
    { type: 'template' as const, count: templateUrlCount },
    { type: 'content' as const, count: contentUrlCount },
    { type: 'unique' as const, count: uniqueUrlCount },
    { type: 'dynamic' as const, count: dynamicUrlCount },
  ].filter((s) => s.count > 0)

  const kpis = [
    {
      label: 'Raw Pages',
      value: formatNum(analysis.rawPageCount),
      sub: `+${formatNum(analysis.assetUrlsFiltered)} assets filtered`,
      color: 'text-gray-900',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
    },
    {
      label: 'Template Types',
      value: formatNum(analysis.templateTypesCount),
      sub: 'Repeating page patterns',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Content Pages',
      value: formatNum(analysis.contentPagesCount),
      sub: `${total > 0 ? ((analysis.contentPagesCount / total) * 100).toFixed(0) : 0}% of raw pages`,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
    {
      label: 'Unique Pages',
      value: formatNum(analysis.uniquePagesCount),
      sub: 'No repeating pattern',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Dynamic Pages',
      value: formatNum(analysis.dynamicPagesCount),
      sub: 'Generated on-demand',
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      label: 'Weighted Pages',
      value: formatNum(analysis.weightedPageCount),
      sub: `${total > 0 ? ((analysis.weightedPageCount / total) * 100).toFixed(0) : 0}% of raw count`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
  ]

  const confidenceBadge =
    analysis.platformConfidence === 'high'
      ? 'bg-green-100 text-green-700'
      : analysis.platformConfidence === 'medium'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-gray-100 text-gray-500'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
          3
        </div>
        <h2 className="text-gray-900 font-semibold text-base">Analysis Overview</h2>
      </div>

      {/* Domain header */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 mb-5 text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="font-semibold text-gray-900">{analysis.domain}</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${confidenceBadge}`}>
            {analysis.platform}
          </span>
          <span className="text-xs text-gray-400">({analysis.platformConfidence} confidence)</span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500 text-xs">
          {formatNum(analysis.rawPageCount)} pages found &bull; {formatNum(analysis.assetUrlsFiltered)} assets filtered
        </span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-400 text-xs">
          {new Date(analysis.analyzedAt).toLocaleString()}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bg} border ${kpi.border} rounded-lg p-3`}
          >
            <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-xs font-semibold text-gray-700 mt-0.5">{kpi.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Distribution Bar */}
      {total > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Page Type Distribution</p>
          <div className="h-4 rounded-full overflow-hidden flex">
            {barSegments.map((seg) => {
              const pct = (seg.count / total) * 100
              if (pct < 0.1) return null
              return (
                <div
                  key={seg.type}
                  className={`${COLORS[seg.type].bg} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${COLORS[seg.type].label}: ${formatNum(seg.count)} (${pct.toFixed(1)}%)`}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {barSegments.map((seg) => {
              const pct = (seg.count / total) * 100
              if (pct < 0.1) return null
              return (
                <div key={seg.type} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-sm ${COLORS[seg.type].bg}`} />
                  <span className="text-xs text-gray-600">
                    {COLORS[seg.type].label}:{' '}
                    <span className="font-medium">{formatNum(seg.count)}</span>{' '}
                    <span className="text-gray-400">({pct.toFixed(1)}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
