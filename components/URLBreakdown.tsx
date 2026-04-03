'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import type { AnalysisResult, CategoryGroup, ClassifiedURL } from '@/types'

interface Props {
  analysis: AnalysisResult
}

const TYPE_BADGE: Record<string, string> = {
  template: 'bg-blue-100 text-blue-700',
  content:  'bg-green-100 text-green-700',
  unique:   'bg-amber-100 text-amber-700',
  dynamic:  'bg-red-100 text-red-700',
}

const CATEGORY_DOT: Record<string, string> = {
  'Product Pages':          'bg-violet-500',
  'Collection Pages':       'bg-indigo-500',
  'Blog Posts':             'bg-sky-500',
  'Static Pages':           'bg-amber-500',
  'Homepage':               'bg-green-500',
  'Blog Index':             'bg-teal-500',
  'Category Pages':         'bg-cyan-500',
  'Search Pages':           'bg-red-400',
  'Account Pages':          'bg-orange-500',
  'Checkout / Cart Pages':  'bg-rose-500',
  'Policy / Legal Pages':   'bg-slate-500',
  'Help Center / Docs Pages': 'bg-lime-500',
  'Landing Pages':          'bg-pink-500',
  'Brand Pages':            'bg-purple-500',
  'Plant / Database Pages': 'bg-emerald-500',
  'Other':                  'bg-gray-400',
}

/** Render a confidence score as a coloured pill */
function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 85 ? 'bg-green-100 text-green-700' :
    pct >= 65 ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
      {pct}%
    </span>
  )
}

function CategorySection({ group }: { group: CategoryGroup }) {
  const [isOpen, setIsOpen]           = useState(false)
  const [showReasoning, setShowReasoning] = useState(false)
  const dotColor = CATEGORY_DOT[group.category] ?? 'bg-gray-400'

  const templateUrls = group.urls.filter((u) => u.pageType === 'template')
  const contentUrls  = group.urls.filter((u) => u.pageType === 'content')
  const uniqueUrls   = group.urls.filter((u) => u.pageType === 'unique')
  const dynamicUrls  = group.urls.filter((u) => u.pageType === 'dynamic')

  // Show: all template + dynamic, plus up to 10 content/unique
  const sampleUrls: ClassifiedURL[] = [
    ...templateUrls,
    ...dynamicUrls.slice(0, 3),
    ...[...contentUrls, ...uniqueUrls].slice(0, 10),
  ]

  const hiddenCount = Math.max(0, group.rawCount - sampleUrls.length)
  const avgConf     = group.avgConfidence ?? 0.5

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isOpen
            ? <ChevronDown size={14} className="text-gray-400 shrink-0" />
            : <ChevronRight size={14} className="text-gray-400 shrink-0" />
          }
          <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-800 truncate">{group.category}</span>
          <span className="text-xs text-gray-400 shrink-0">{group.typeLabel}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <ConfidencePill value={avgConf} />
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{group.rawCount.toLocaleString()}</span> raw
          </span>
          <span className="text-xs text-green-600">
            <span className="font-semibold">{group.weightedCount.toLocaleString()}</span> weighted
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="p-3.5 space-y-3">

            {/* Type summary pills */}
            <div className="flex flex-wrap gap-2 text-xs">
              {templateUrls.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {templateUrls.length} template
                </span>
              )}
              {contentUrls.length > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                  {contentUrls.length.toLocaleString()} content
                </span>
              )}
              {uniqueUrls.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                  {uniqueUrls.length} unique
                </span>
              )}
              {dynamicUrls.length > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                  {dynamicUrls.length} dynamic
                </span>
              )}
            </div>

            {/* Cluster reasoning (explainability) */}
            {group.clusterReasoning && (
              <div>
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <Info size={11} />
                  {showReasoning ? 'Hide explanation' : 'Why was this classified this way?'}
                </button>
                {showReasoning && (
                  <div className="mt-2 p-2.5 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-800 leading-relaxed">
                    {group.clusterReasoning}
                    {group.representativeUrl && (
                      <div className="mt-1.5 pt-1.5 border-t border-indigo-100 text-indigo-600 break-all">
                        Representative URL: {group.representativeUrl}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* URL list */}
            <div className="space-y-0.5">
              {sampleUrls.map((u) => (
                <URLRow key={u.url} url={u} />
              ))}
            </div>

            {hiddenCount > 0 && (
              <p className="text-xs text-gray-400 italic">
                + {hiddenCount.toLocaleString()} more URL{hiddenCount !== 1 ? 's' : ''} not shown
                {group.contentCount > 0 ? ' (content pages)' : ''} — use CSV export for full list
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function URLRow({ url: u }: { url: ClassifiedURL }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const hasReasoning = u.reasoning && u.reasoning.length > 0

  return (
    <div className="py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-2">
        <span
          className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 mt-0.5 ${TYPE_BADGE[u.pageType] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {u.pageType}
        </span>
        <a
          href={u.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-green-700 hover:underline break-all leading-relaxed flex-1"
        >
          {u.url}
        </a>
        <div className="flex items-center gap-1.5 shrink-0">
          {u.confidence != null && <ConfidencePill value={u.confidence} />}
          <span className="text-xs text-gray-400">×{u.weightedValue}</span>
          {hasReasoning && (
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-gray-300 hover:text-indigo-500 transition-colors"
              title="Why this classification?"
            >
              <Info size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Per-URL reasoning dropdown */}
      {showReasoning && hasReasoning && (
        <div className="mt-1.5 ml-10 p-2 bg-indigo-50 border border-indigo-100 rounded text-xs text-indigo-800 space-y-0.5">
          {u.reasoning!.map((note, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
              <span>{note}</span>
            </div>
          ))}
          {u.sourceSitemap && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-indigo-100">
              <span className="text-indigo-400 shrink-0 mt-0.5">⬡</span>
              <span>Source sitemap: <code className="bg-indigo-100 px-1 rounded">{u.sourceSitemap}</code></span>
            </div>
          )}
          {u.dynamicSignals && u.dynamicSignals.length > 0 && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-indigo-100">
              <span className="text-red-400 shrink-0 mt-0.5">⚡</span>
              <span>Dynamic signals: {u.dynamicSignals.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function URLBreakdown({ analysis }: Props) {
  const [showAll, setShowAll] = useState(false)

  const displayCategories = showAll
    ? analysis.categories
    : analysis.categories.slice(0, 8)

  const hiddenCount = analysis.categories.length - 8

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
            7
          </div>
          <h2 className="text-gray-900 font-semibold text-base">URL Breakdown</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Expandable · with reasoning
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {analysis.allClassifiedUrls.length.toLocaleString()} classified URLs
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-green-200 inline-block" />
          Confidence ≥ 85% = high
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block" />
          65–84% = medium
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gray-200 inline-block" />
          &lt; 65% = low
        </div>
        <div className="flex items-center gap-1.5">
          <Info size={11} className="text-indigo-400" />
          Click ⓘ to see classification reasoning
        </div>
      </div>

      <div className="space-y-2">
        {displayCategories.map((group) => (
          <CategorySection key={group.category} group={group} />
        ))}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'category' : 'categories'}
        </button>
      )}
    </div>
  )
}
