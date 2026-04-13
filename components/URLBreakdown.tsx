'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Info, Layers } from 'lucide-react'
import type { AnalysisResult, CategoryGroup, ClassifiedURL } from '@/types'

interface Props {
  analysis: AnalysisResult
}

const TYPE_BADGE: Record<string, string> = {
  template: 'bg-[color:var(--scan-soft)] text-[color:var(--scan)]',
  content:  'bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]',
  unique:   'bg-[color:var(--surface-2)] text-[color:var(--ink-2)]',
  dynamic:  'bg-[color:var(--alert-soft)] text-[color:var(--alert)]',
}

// All category dots use the same brand green. Differentiation reads from the
// category label, not from a rainbow — scanner tools don't need 16 hues.
const CATEGORY_DOT: Record<string, string> = new Proxy(
  {},
  { get: () => 'bg-[color:var(--brand)]' }
) as Record<string, string>

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 85 ? 'bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]' :
    pct >= 65 ? 'bg-[color:var(--warn-soft)] text-[color:var(--warn)]' :
                'bg-[color:var(--surface-2)] text-[color:var(--ink-3)]'
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded-[2px] font-mono text-[10px] font-medium tabular-nums ${color}`}>
      {pct}%
    </span>
  )
}

/**
 * Layout Family Card — shown instead of a "template" URL row for family groups.
 * Makes clear the template is a shared layout concept, not a specific URL.
 */
function LayoutFamilyCard({
  group,
  weights,
}: {
  group: CategoryGroup
  weights: { template: number; content: number }
}) {
  const [showReasoning, setShowReasoning] = useState(false)
  const contentCount = group.contentCount
  const representativeUrl = group.representativeUrl

  return (
    <div className="rounded-lg border border-[color:var(--scan)] bg-[color:var(--scan-soft)] p-3 mb-2">
      <div className="flex items-start gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 bg-[color:var(--scan-soft)] rounded-md shrink-0 mt-0.5">
          <Layers size={14} className="text-[color:var(--scan)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[color:var(--scan)] uppercase tracking-wide">
              Shared Layout
            </span>
            <span className="text-xs text-[color:var(--scan)]">
              1 full audit × {weights.template}
            </span>
          </div>
          <p className="text-xs text-[color:var(--scan)] mt-0.5 leading-relaxed">
            All <span className="font-semibold">{group.rawCount.toLocaleString()}</span> pages
            in this group share the same layout — navigation, page regions, components, and
            structure are identical. Only the content changes (names, descriptions, images).
          </p>
          <p className="text-xs text-[color:var(--scan)] mt-1">
            Priced as: <span className="font-medium">1 layout audit (×{weights.template})</span>
            {' + '}
            <span className="font-medium">
              {contentCount.toLocaleString()} content checks (×{weights.content} each)
            </span>
            {' = '}
            <span className="font-bold">{group.weightedCount.toLocaleString()} weighted pages</span>
          </p>

          {representativeUrl && (
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="mt-1.5 flex items-center gap-1 text-xs text-[color:var(--scan)] hover:text-[color:var(--scan)]"
            >
              <Info size={11} />
              {showReasoning ? 'Hide reference URL' : 'Show layout reference URL'}
            </button>
          )}
          {showReasoning && representativeUrl && (
            <div className="mt-1.5 p-2 bg-white border border-[color:var(--scan-soft)] rounded text-xs text-gray-600 break-all">
              <span className="text-[color:var(--scan)] font-medium">Layout reference (any page can serve as the audit target):</span>
              <br />
              <a
                href={representativeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-[color:var(--scan)]"
              >
                {representativeUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function URLRow({ url: u, hideBadgeIfFamily }: { url: ClassifiedURL; hideBadgeIfFamily?: boolean }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const hasReasoning = u.reasoning && u.reasoning.length > 0
  // In a family group, show all URLs as "content" even if the data model marks one as "template"
  const displayType = hideBadgeIfFamily && u.pageType === 'template' ? 'content' : u.pageType

  return (
    <div className="py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-2">
        <span
          className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 mt-0.5 ${TYPE_BADGE[displayType] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {displayType}
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
          {/* In family groups, all URLs show the content weight for clarity */}
          <span className="text-xs text-gray-400">
            ×{hideBadgeIfFamily && u.pageType === 'template' ? u.weightedValue : u.weightedValue}
          </span>
          {hasReasoning && (
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-gray-300 hover:text-ink-3 transition-colors"
              title="Why this classification?"
            >
              <Info size={12} />
            </button>
          )}
        </div>
      </div>

      {showReasoning && hasReasoning && (
        <div className="mt-1.5 ml-10 p-2 bg-[color:var(--brand-tint)] border border-[color:var(--rule)] rounded text-xs text-ink space-y-0.5">
          {u.reasoning!.map((note, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-ink-4 shrink-0 mt-0.5">•</span>
              <span>{note}</span>
            </div>
          ))}
          {u.sourceSitemap && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-[color:var(--rule)]">
              <span className="text-ink-4 shrink-0 mt-0.5">⬡</span>
              <span>Source: <code className="bg-[color:var(--brand-soft)] px-1 rounded">{u.sourceSitemap}</code></span>
            </div>
          )}
          {u.dynamicSignals && u.dynamicSignals.length > 0 && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-[color:var(--rule)]">
              <span className="text-red-400 shrink-0 mt-0.5">⚡</span>
              <span>Dynamic signals: {u.dynamicSignals.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  group,
  weights,
}: {
  group: CategoryGroup
  weights: { template: number; content: number }
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showClusterReasoning, setShowClusterReasoning] = useState(false)
  const dotColor = CATEGORY_DOT[group.category] ?? 'bg-gray-400'
  const isFamilyGroup = group.isFamilyGroup === true

  // For family groups: show all URLs in the list (no special template row)
  // For regular groups: show template, then sample of content/unique/dynamic
  let sampleUrls: ClassifiedURL[]
  let hiddenCount: number

  if (isFamilyGroup) {
    // Show up to 10 sample URLs — all displayed as "content"
    sampleUrls = group.urls.slice(0, 10)
    hiddenCount = Math.max(0, group.rawCount - sampleUrls.length)
  } else {
    const templateUrls = group.urls.filter((u) => u.pageType === 'template')
    const contentUrls  = group.urls.filter((u) => u.pageType === 'content')
    const uniqueUrls   = group.urls.filter((u) => u.pageType === 'unique')
    const dynamicUrls  = group.urls.filter((u) => u.pageType === 'dynamic')
    sampleUrls = [
      ...templateUrls,
      ...dynamicUrls.slice(0, 3),
      ...[...contentUrls, ...uniqueUrls].slice(0, 10),
    ]
    hiddenCount = Math.max(0, group.rawCount - sampleUrls.length)
  }

  const avgConf = group.avgConfidence ?? 0.5
  const contentCount = group.contentCount

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

            {/* Family group: layout family card */}
            {isFamilyGroup && (
              <LayoutFamilyCard group={group} weights={weights} />
            )}

            {/* Non-family: type summary pills */}
            {!isFamilyGroup && (
              <div className="flex flex-wrap gap-2 text-xs">
                {group.templateCount > 0 && (
                  <span className="px-2 py-0.5 bg-[color:var(--scan-soft)] text-[color:var(--scan)] rounded-full font-medium">
                    {group.templateCount} template
                  </span>
                )}
                {contentCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                    {contentCount.toLocaleString()} content
                  </span>
                )}
                {group.uniqueCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                    {group.uniqueCount} unique
                  </span>
                )}
                {group.dynamicCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                    {group.dynamicCount} dynamic
                  </span>
                )}
              </div>
            )}

            {/* Cluster reasoning (non-family groups) */}
            {!isFamilyGroup && group.clusterReasoning && (
              <div>
                <button
                  onClick={() => setShowClusterReasoning(!showClusterReasoning)}
                  className="flex items-center gap-1 text-xs text-[color:var(--brand-deep)] hover:text-ink font-medium"
                >
                  <Info size={11} />
                  {showClusterReasoning ? 'Hide explanation' : 'Why was this classified this way?'}
                </button>
                {showClusterReasoning && (
                  <div className="mt-2 p-2.5 bg-[color:var(--brand-tint)] border border-[color:var(--rule)] rounded text-xs text-ink leading-relaxed">
                    {group.clusterReasoning}
                  </div>
                )}
              </div>
            )}

            {/* URL list */}
            <div className="space-y-0.5">
              {sampleUrls.map((u) => (
                <URLRow key={u.url} url={u} hideBadgeIfFamily={isFamilyGroup} />
              ))}
            </div>

            {hiddenCount > 0 && (
              <p className="text-xs text-gray-400 italic">
                + {hiddenCount.toLocaleString()} more URL{hiddenCount !== 1 ? 's' : ''} not shown
                {isFamilyGroup ? ' (same layout, content-only)' : contentCount > 0 ? ' (content pages)' : ''}
                {' — '}use CSV export for full list
              </p>
            )}
          </div>
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
  const weights = { template: analysis.weights.template, content: analysis.weights.content }

  return (
    <div className="ace-panel">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-baseline gap-5">
          <div className="ace-num">7</div>
          <div className="flex flex-col gap-0.5">
            <span className="ace-section-kicker">Section 7</span>
            <h2 className="ace-title">URL Breakdown</h2>
          </div>
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
          <Layers size={11} className="text-[color:var(--scan)]" />
          Layout Family = shared structure, content-only pages
        </div>
        <div className="flex items-center gap-1.5">
          <Info size={11} className="text-ink-4" />
          Click ⓘ for classification reasoning
        </div>
      </div>

      <div className="space-y-2">
        {displayCategories.map((group) => (
          <CategorySection key={group.category} group={group} weights={weights} />
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
