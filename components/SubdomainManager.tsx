'use client'

import { useState } from 'react'
import { Plus, Trash2, Globe, ToggleLeft, ToggleRight, AlertCircle, Loader2, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import type { SubdomainEntry, PageWeights } from '@/types'

interface Props {
  subdomains: SubdomainEntry[]
  weights: PageWeights
  mainDomain: string
  onAdd: (sitemapUrl: string) => void
  onRemove: (id: string) => void
  onToggleIncluded: (id: string) => void
  combinedWeightedCount: number
  combinedRawCount: number
}

function statusIcon(status: SubdomainEntry['status']) {
  switch (status) {
    case 'scanning':
      return <Loader2 size={14} className="text-[color:var(--scan)] animate-spin shrink-0" />
    case 'complete':
      return <CheckCircle2 size={14} className="text-green-500 shrink-0" />
    case 'error':
      return <AlertCircle size={14} className="text-red-500 shrink-0" />
    default:
      return <Globe size={14} className="text-gray-400 shrink-0" />
  }
}

function SubdomainCard({
  entry,
  onRemove,
  onToggleIncluded,
}: {
  entry: SubdomainEntry
  onRemove: () => void
  onToggleIncluded: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isComplete = entry.status === 'complete' && entry.analysis

  return (
    <div
      className={`rounded-lg border transition-colors ${
        entry.included && isComplete
          ? 'border-green-200 bg-green-50/40'
          : entry.status === 'error'
          ? 'border-red-200 bg-red-50/40'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-3">
        {statusIcon(entry.status)}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{entry.label}</p>
          <p className="text-xs text-gray-400 truncate">{entry.sitemapUrl}</p>
        </div>

        {/* Stats when complete */}
        {isComplete && (
          <div className="hidden sm:flex items-center gap-3 text-xs shrink-0">
            <span className="text-gray-500">
              <span className="font-semibold text-gray-700">{entry.analysis!.rawPageCount.toLocaleString()}</span> raw
            </span>
            <span className="text-green-600">
              <span className="font-semibold">{entry.analysis!.weightedPageCount.toLocaleString()}</span> weighted
            </span>
          </div>
        )}

        {/* Progress while scanning */}
        {entry.status === 'scanning' && (
          <span className="text-xs text-[color:var(--scan)] shrink-0">
            {entry.progressStep ?? 'Scanning…'} {entry.progress != null ? `${entry.progress}%` : ''}
          </span>
        )}

        {/* Include toggle */}
        {isComplete && (
          <button
            onClick={onToggleIncluded}
            title={entry.included ? 'Included in quote — click to exclude' : 'Excluded from quote — click to include'}
            className="shrink-0"
          >
            {entry.included
              ? <ToggleRight size={22} className="text-green-600" />
              : <ToggleLeft size={22} className="text-gray-400" />
            }
          </button>
        )}

        {/* Expand details */}
        {isComplete && (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 shrink-0">
            {expanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
            }
          </button>
        )}

        {/* Remove */}
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
          title="Remove subdomain"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Progress bar while scanning */}
      {entry.status === 'scanning' && entry.progress != null && (
        <div className="mx-3 mb-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[color:var(--scan-soft)]0 rounded-full transition-all duration-300"
              style={{ width: `${entry.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {entry.status === 'error' && entry.errorMessage && (
        <div className="mx-3 mb-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded text-xs text-red-600">
          {entry.errorMessage}
        </div>
      )}

      {/* Expanded details */}
      {expanded && isComplete && entry.analysis && (
        <div className="border-t border-gray-100 px-3 py-2.5 space-y-2">
          {/* Category summary mini-table */}
          <div className="text-xs text-gray-500 font-medium mb-1">Top categories:</div>
          <div className="space-y-1">
            {entry.analysis.categories.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 flex-1 truncate">{cat.category}</span>
                <span className="text-xs text-gray-400">{cat.rawCount.toLocaleString()} raw</span>
                <span className="text-xs text-green-600 font-medium">{cat.weightedCount.toLocaleString()} wtd</span>
              </div>
            ))}
            {entry.analysis.categories.length > 5 && (
              <p className="text-xs text-gray-400 italic">
                + {entry.analysis.categories.length - 5} more categories
              </p>
            )}
          </div>

          {/* Include note */}
          <div className={`mt-2 text-xs font-medium ${entry.included ? 'text-green-600' : 'text-gray-400'}`}>
            {entry.included
              ? '✓ Included in combined quote'
              : '○ Excluded from combined quote — toggle to include'
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubdomainManager({
  subdomains,
  weights,
  mainDomain,
  onAdd,
  onRemove,
  onToggleIncluded,
  combinedWeightedCount,
  combinedRawCount,
}: Props) {
  const [inputUrl, setInputUrl] = useState('')
  const [inputError, setInputError] = useState('')

  const handleAdd = () => {
    const trimmed = inputUrl.trim()
    if (!trimmed) {
      setInputError('Enter a sitemap URL')
      return
    }
    if (!trimmed.startsWith('http')) {
      setInputError('URL must start with http:// or https://')
      return
    }
    // Prevent adding the same URL twice
    if (subdomains.some((s) => s.sitemapUrl === trimmed)) {
      setInputError('This URL has already been added')
      return
    }
    setInputError('')
    setInputUrl('')
    onAdd(trimmed)
  }

  const includedCount = subdomains.filter((s) => s.included && s.status === 'complete').length
  const totalSubdomainWeighted = subdomains
    .filter((s) => s.included && s.analysis)
    .reduce((sum, s) => sum + (s.analysis?.weightedPageCount ?? 0), 0)

  return (
    <div className="ace-panel">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-7 h-7 bg-[color:var(--brand)] text-white text-xs font-bold rounded-full">
          S
        </div>
        <div>
          <h2 className="text-gray-900 font-semibold text-base">Subdomains & Additional Sections</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Scan additional subdomains separately. Toggle each one in or out of the combined quote.
          </p>
        </div>
      </div>

      {/* Add input */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => { setInputUrl(e.target.value); setInputError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`e.g. https://plants.${mainDomain}/sitemap.php`}
            className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] ${
              inputError ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          {inputError && (
            <p className="mt-1 text-xs text-red-600">{inputError}</p>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 ace-btn"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* Subdomain cards */}
      {subdomains.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
          No subdomains added yet. Paste a sitemap URL above and click Add.
        </div>
      ) : (
        <div className="space-y-2">
          {subdomains.map((entry) => (
            <SubdomainCard
              key={entry.id}
              entry={entry}
              onRemove={() => onRemove(entry.id)}
              onToggleIncluded={() => onToggleIncluded(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Combined total banner */}
      {includedCount > 0 && (
        <div className="mt-4 p-3 bg-[color:var(--brand-tint)] border border-[color:var(--rule)] rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-[color:var(--brand-deep)]">
              <span className="font-semibold">Combined total</span>{' '}
              (main domain + {includedCount} subdomain{includedCount !== 1 ? 's' : ''})
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[color:var(--brand-deep)]">
                <span className="font-bold">{combinedRawCount.toLocaleString()}</span> raw pages
              </span>
              <span className="text-green-700 font-bold">
                {combinedWeightedCount.toLocaleString()} weighted pages
              </span>
            </div>
          </div>
          <div className="mt-1.5 text-xs text-ink-3">
            Subdomains contributing: +{totalSubdomainWeighted.toLocaleString()} weighted pages — quote recommendation updates automatically.
          </div>
        </div>
      )}

      {/* Weights note */}
      <p className="mt-3 text-xs text-gray-400">
        Subdomains are classified using the same page weights as the main domain
        (Template ×{weights.template}, Content ×{weights.content}, Unique ×{weights.unique}, Dynamic ×{weights.dynamic}).
      </p>
    </div>
  )
}
