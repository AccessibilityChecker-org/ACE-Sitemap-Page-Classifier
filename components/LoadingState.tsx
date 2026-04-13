'use client'

import type { AnalysisProgress } from '@/types'

interface Props {
  progress: AnalysisProgress
}

export default function LoadingState({ progress }: Props) {
  if (progress.isError) {
    return (
      <div className="ace-panel" style={{ borderTopColor: 'var(--crimson)' }}>
        <div className="flex items-baseline gap-5">
          <div className="ace-num" style={{ color: 'var(--crimson)' }}>!</div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="ace-section-kicker" style={{ color: 'var(--crimson)' }}>
              Error
            </span>
            <h3 className="ace-title">Analysis failed</h3>
            <p className="text-ink-muted text-sm mt-2">
              {progress.errorMessage || 'An unexpected error occurred.'}
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft mt-1">
              Check the sitemap URL or paste the XML directly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { label: 'Fetch',    threshold: 15 },
    { label: 'Parse',    threshold: 30 },
    { label: 'Classify', threshold: 60 },
    { label: 'Price',    threshold: 85 },
    { label: 'Done',     threshold: 100 },
  ]

  return (
    <div className="ace-panel ace-panel--inset">
      <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
        <div className="font-display italic leading-none text-ink" style={{ fontSize: '88px', letterSpacing: '-0.02em' }}>
          {String(progress.percent).padStart(2, '0')}
          <span className="text-ink-soft">%</span>
        </div>
        <div className="min-w-0">
          <div className="ace-section-kicker mb-1">In progress</div>
          <h3 className="ace-title mb-1">{progress.step}</h3>
          <p className="text-ink-muted text-sm mb-4">{progress.detail}</p>

          {/* Progress rule */}
          <div className="h-[3px] bg-[color:var(--rule)] relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-[color:var(--forest)] transition-all duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          {/* Step markers */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {steps.map((step, i) => {
              const done   = progress.percent >= step.threshold
              const active = !done && progress.percent >= step.threshold - 15
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    color: done
                      ? 'var(--forest)'
                      : active
                      ? 'var(--ink)'
                      : 'var(--ink-soft)',
                  }}
                >
                  <span
                    className="w-3 h-3 border-[1.5px] flex items-center justify-center"
                    style={{
                      borderColor: done ? 'var(--forest)' : 'var(--rule-strong)',
                      background: done ? 'var(--forest)' : 'transparent',
                    }}
                  >
                    {done && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.5 1.5L6.5 2" stroke="#F4EEDF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {String(i + 1).padStart(2, '0')} {step.label}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
