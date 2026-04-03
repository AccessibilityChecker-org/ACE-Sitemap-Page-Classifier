'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { PageWeights } from '@/types'

interface Props {
  weights: PageWeights
  onChange: (weights: PageWeights) => void
}

export default function PageWeightsEditor({ weights, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleChange = (key: keyof PageWeights, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && num >= 0 && num <= 10) {
      onChange({ ...weights, [key]: num })
    }
  }

  const fields: { key: keyof PageWeights; label: string; description: string; color: string }[] = [
    {
      key: 'template',
      label: 'Template',
      description: 'The single structural template page (e.g., one product page template)',
      color: 'text-blue-600',
    },
    {
      key: 'unique',
      label: 'Unique',
      description: 'One-of-a-kind pages like Homepage, Contact, About (no repeating pattern)',
      color: 'text-amber-600',
    },
    {
      key: 'content',
      label: 'Content',
      description: 'Repeated content pages sharing a template (e.g., 6,000 product detail pages)',
      color: 'text-green-600',
    },
    {
      key: 'dynamic',
      label: 'Dynamic',
      description: 'Pages that generate content on-demand: search results, account pages, cart',
      color: 'text-red-500',
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
            2
          </div>
          <h2 className="text-gray-900 font-semibold text-base">Page Weights</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Default values set
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>Customize</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {/* Always visible: current weights summary */}
      <div className="mt-4 flex flex-wrap gap-3">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
            <span className={`text-xs font-semibold ${f.color}`}>{f.label}:</span>
            <span className="text-xs font-bold text-gray-900">{weights[f.key]}</span>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Weights determine how many &ldquo;effective pages&rdquo; each URL type counts as. A product page
              template counts as 1.0, but all the content copies sharing that template count as just
              0.2 each — because they require the same accessibility fixes as the template.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <span className={f.color}>{f.label} Page Weight</span>
                </label>
                <input
                  type="number"
                  value={weights[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">{f.description}</p>
              </div>
            ))}
          </div>

          {/* How it works example */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">How it works — Example:</p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>1 Product Template</span>
                <span className="font-medium">× {weights.template} = {weights.template}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>6,181 Product Content Pages</span>
                <span className="font-medium">× {weights.content} = {(6181 * weights.content).toFixed(0)}</span>
              </div>
              <div className="border-t border-gray-200 pt-1 flex items-center justify-between">
                <span className="font-semibold text-gray-700">6,182 Raw → Weighted</span>
                <span className="font-bold text-green-700">
                  {(weights.template + 6181 * weights.content).toFixed(0)} effective pages
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
