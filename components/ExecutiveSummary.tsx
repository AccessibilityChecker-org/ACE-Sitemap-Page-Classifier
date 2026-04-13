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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 bg-indigo-600 text-white rounded-full">
          <FileText size={14} />
        </div>
        <h2 className="text-gray-900 font-semibold text-base">Executive Summary</h2>
        <span className="text-xs text-gray-400 ml-auto">Paste-ready proposal paragraph</span>
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
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
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
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="relative">
        <textarea
          value={displayText}
          onChange={(e) => setOverrideText(e.target.value)}
          rows={7}
          className="w-full px-3 py-2.5 text-sm text-gray-800 leading-relaxed border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 font-[inherit]"
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            copied
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
        {overrideText !== null && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Reset to generated
          </button>
        )}
        <p className="text-xs text-gray-400 ml-auto">
          Numbers update live from your scan. Edit the text freely before copying.
        </p>
      </div>
    </div>
  )
}
