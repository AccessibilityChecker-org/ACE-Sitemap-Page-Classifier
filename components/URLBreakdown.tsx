'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AnalysisResult, CategoryGroup, ClassifiedURL } from '@/types'

interface Props {
  analysis: AnalysisResult
}

const TYPE_BADGE: Record<string, string> = {
  template: 'bg-blue-100 text-blue-700',
  content: 'bg-green-100 text-green-700',
  unique: 'bg-amber-100 text-amber-700',
  dynamic: 'bg-red-100 text-red-700',
}

const CATEGORY_DOT: Record<string, string> = {
  'Product Pages': 'bg-violet-500',
  'Collection Pages': 'bg-indigo-500',
  'Blog Posts': 'bg-sky-500',
  'Static Pages': 'bg-amber-500',
  'Homepage': 'bg-green-500',
  'Blog Index': 'bg-teal-500',
  'Category Pages': 'bg-cyan-500',
  'Search Pages': 'bg-red-400',
  'Account Pages': 'bg-orange-500',
  'Checkout / Cart Pages': 'bg-rose-500',
  'Policy / Legal Pages': 'bg-slate-500',
  'Help Center / Docs Pages': 'bg-lime-500',
  'Landing Pages': 'bg-pink-500',
  'Other': 'bg-gray-400',
}

function CategorySection({ group }: { group: CategoryGroup }) {
  const [isOpen, setIsOpen] = useState(false)
  const dotColor = CATEGORY_DOT[group.category] ?? 'bg-gray-400'

  // Get template URL
  const templateUrls = group.urls.filter((u) => u.pageType === 'template')
  const contentUrls = group.urls.filter((u) => u.pageType === 'content')
  const uniqueUrls = group.urls.filter((u) => u.pageType === 'unique')
  const dynamicUrls = group.urls.filter((u) => u.pageType === 'dynamic')

  // Sample: first 10 content/unique/dynamic URLs for display
  const sampleUrls: ClassifiedURL[] = [
    ...templateUrls,
    ...[...contentUrls, ...uniqueUrls, ...dynamicUrls].slice(0, 10),
  ]

  const totalShowable = group.rawCount
  const hiddenCount = Math.max(0, totalShowable - sampleUrls.length)

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isOpen ? (
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
          )}
          <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${dotColor}`} />
          <span className="text-sm font-semibold text-gray-800">{group.category}</span>
          <span className="text-xs text-gray-400">{group.typeLabel}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
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

            {/* URL list */}
            <div className="space-y-1">
              {sampleUrls.map((u) => (
                <div
                  key={u.url}
                  className="flex items-start gap-2 py-1 border-b border-gray-100 last:border-0"
                >
                  <span
                    className={`inline-flex px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 mt-0.5 ${TYPE_BADGE[u.pageType] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {u.pageType}
                  </span>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-green-700 hover:underline break-all leading-relaxed"
                  >
                    {u.url}
                  </a>
                  <span className="text-xs text-gray-400 shrink-0 ml-auto">
                    ×{u.weightedValue}
                  </span>
                </div>
              ))}
            </div>

            {hiddenCount > 0 && (
              <p className="text-xs text-gray-400 italic">
                + {hiddenCount.toLocaleString()} more {group.contentCount > 0 ? 'content' : ''} URLs
                not shown (use CSV export for full list)
              </p>
            )}

            {/* Classification note */}
            {sampleUrls[0]?.notes && (
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                Rule: {sampleUrls[0].notes}
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
            7
          </div>
          <h2 className="text-gray-900 font-semibold text-base">URL Breakdown</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Expandable
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {analysis.allClassifiedUrls.length.toLocaleString()} total classified URLs
        </span>
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
          Show {hiddenCount} more categories
        </button>
      )}
    </div>
  )
}
