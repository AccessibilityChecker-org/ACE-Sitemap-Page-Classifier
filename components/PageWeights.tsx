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

  const fields: { key: keyof PageWeights; label: string; description: string; accent: string }[] = [
    {
      key: 'template',
      label: 'Template',
      description: 'The single structural template page, e.g. one product-page template.',
      accent: 'var(--brand-deep)',
    },
    {
      key: 'unique',
      label: 'Unique',
      description: 'One-of-a-kind pages like Homepage, Contact, About. No repeating pattern.',
      accent: 'var(--warn)',
    },
    {
      key: 'content',
      label: 'Content',
      description: 'Repeated content pages sharing a template, e.g. 6,000 product detail pages.',
      accent: 'var(--brand)',
    },
    {
      key: 'dynamic',
      label: 'Dynamic',
      description: 'Pages generated on-demand: search, account, cart, filters.',
      accent: 'var(--alert)',
    },
  ]

  return (
    <div className="ace-panel">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-5">
          <div className="ace-num">2</div>
          <div className="flex flex-col gap-0.5">
            <span className="ace-section-kicker">Section 2</span>
            <h2 className="ace-title">Page Weights</h2>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ace-btn ace-btn--ghost"
        >
          {isExpanded ? (<><span>Collapse</span><ChevronUp size={14} /></>) : (<><span>Customize</span><ChevronDown size={14} /></>)}
        </button>
      </div>

      {/* Always visible: current weights as a specimen strip */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 border-t border-[color:var(--rule)]">
        {fields.map((f) => (
          <div
            key={f.key}
            className="py-4 px-5 border-r last:border-r-0 border-[color:var(--rule)] flex items-baseline justify-between gap-3"
            style={{ borderBottom: '1px solid var(--rule)' }}
          >
            <div className="flex flex-col">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: f.accent }}
              >
                {f.label}
              </span>
              <span className="text-[11px] text-ink-soft mt-0.5">weight</span>
            </div>
            <span className="ace-stat text-[32px] leading-none text-ink">
              {weights[f.key].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-[color:var(--warn-soft)] border-l-2 border-[color:var(--warn)]">
            <Info size={14} className="text-warn mt-0.5 shrink-0" />
            <p className="text-xs text-ink leading-relaxed">
              Weights decide how many &ldquo;effective pages&rdquo; each URL type counts as.
              A product-page template counts as 1.0. Its thousands of content copies count
              as just 0.2 each, because they share the same accessibility surface as the template.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block mb-1.5">
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.2em]"
                    style={{ color: f.accent }}
                  >
                    {f.label} weight
                  </span>
                </label>
                <input
                  type="number"
                  value={weights[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  min={0}
                  max={10}
                  step={0.1}
                  className="ace-input w-full font-mono"
                />
                <p className="text-xs text-ink-soft mt-1.5">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Worked example */}
          <div className="ace-chip" style={{ background: 'var(--surface-2)' }}>
            <p className="ace-section-kicker mb-3">Worked example</p>
            <div className="space-y-1.5 text-[13px] text-ink">
              <div className="flex items-center justify-between">
                <span>1 Product Template</span>
                <span className="ace-stat">× {weights.template} = {weights.template.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>6,181 Product Content Pages</span>
                <span className="ace-stat">× {weights.content} = {(6181 * weights.content).toFixed(0)}</span>
              </div>
              <div className="border-t border-[color:var(--rule)] pt-2 mt-2 flex items-center justify-between">
                <span className="font-semibold">6,182 raw → weighted</span>
                <span className="ace-stat text-forest font-semibold">
                  {(weights.template + 6181 * weights.content).toFixed(0)} effective
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
