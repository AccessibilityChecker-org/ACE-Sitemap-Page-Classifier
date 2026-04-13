'use client'

import { useMemo, useState } from 'react'
import { Copy, Check, FileText } from 'lucide-react'
import type { PricingRecommendation } from '@/types'
import { generateExecutiveSummary } from '@/lib/export/quote'

interface Props {
  rawPageCount: number
  weightedPageCount: number
  recommendation: PricingRecommendation
}

export default function ExecutiveSummary({
  rawPageCount,
  weightedPageCount,
  recommendation,
}: Props) {
  const [clientName, setClientName] = useState('')
  const [planName, setPlanName] = useState(
    recommendation.weightedPlan?.name ?? ''
  )
  const [copied, setCopied] = useState(false)
  const [overrideText, setOverrideText] = useState<string | null>(null)

  const generated = useMemo(
    () =>
      generateExecutiveSummary(
        clientName,
        planName || recommendation.weightedPlan?.name || '',
        rawPageCount,
        weightedPageCount,
        recommendation
      ),
    [clientName, planName, rawPageCount, weightedPageCount, recommendation]
  )

  const displayText = overrideText ?? generated

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      const el = document.createElement('textarea')
      el.value = displayText
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleReset = () => {
    setOverrideText(null)
  }

  return (
    <div className="ace-panel">
      <div className="flex items-baseline gap-5 mb-6">
        <span className="ace-num">A</span>
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="ace-section-kicker">Appendix A</span>
          <h2 className="ace-title">Executive Summary</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft self-center">
          Paste-ready
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value)
              setOverrideText(null)
            }}
            placeholder="e.g. Acme Corp"
            className="ace-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Plan Name
          </label>
          <input
            type="text"
            value={planName}
            onChange={(e) => {
              setPlanName(e.target.value)
              setOverrideText(null)
            }}
            placeholder="e.g. ACE Managed Plus"
            className="ace-input w-full"
          />
        </div>
      </div>

      <div className="relative">
        <textarea
          value={displayText}
          onChange={(e) => setOverrideText(e.target.value)}
          rows={7}
          className="ace-input w-full leading-relaxed"
          style={{ background: 'var(--surface-2)' }}
        />
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleCopy}
          className={copied ? 'ace-btn ace-btn--brand' : 'ace-btn'}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy summary'}
        </button>
        {overrideText !== null && (
          <button onClick={handleReset} className="ace-btn ace-btn--ghost">
            Reset
          </button>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-4 ml-auto">
          Numbers update live from the scan
        </p>
      </div>
    </div>
  )
}
