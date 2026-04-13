'use client'

import type { AnalysisProgress } from '@/types'

interface Props {
  progress: AnalysisProgress
}

export default function LoadingState({ progress }: Props) {
  if (progress.isError) {
    return (
      <div className="ace-panel" style={{ borderColor: 'var(--alert)', background: 'var(--alert-soft)' }}>
        <div className="flex items-start gap-4">
          <span className="ace-chip-mono ace-chip-mono--alert shrink-0">
            <span>ERR</span>
          </span>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h3 className="font-mono font-bold text-[15px] text-ink uppercase tracking-[0.02em]">
              Scan failed
            </h3>
            <p className="text-ink-2 text-sm mt-1">
              {progress.errorMessage || 'An unexpected error occurred.'}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 mt-1">
              # check the sitemap URL or paste XML directly
            </p>
          </div>
        </div>
      </div>
    )
  }

  const steps = [
    { label: 'FETCH',    threshold: 15 },
    { label: 'PARSE',    threshold: 30 },
    { label: 'CLASSIFY', threshold: 60 },
    { label: 'PRICE',    threshold: 85 },
    { label: 'DONE',     threshold: 100 },
  ]

  return (
    <div className="ace-panel ace-panel--inset">
      <div className="flex items-center gap-3 mb-4">
        <span className="ace-chip-mono ace-chip-mono--live">
          <span className="ace-dot ace-dot--cyan" aria-hidden />
          <span>SCANNING</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
          {progress.step}
        </span>
      </div>

      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="font-mono font-bold leading-none text-ink tabular-nums" style={{ fontSize: '64px', letterSpacing: '-0.04em' }}>
          {String(progress.percent).padStart(2, '0')}
          <span className="text-[color:var(--brand)]">%</span>
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[12px] text-ink-2 mb-3">{progress.detail}</p>

          {/* Progress bar with sweep overlay */}
          <div className="h-[6px] bg-[color:var(--surface)] relative overflow-hidden border border-rule">
            <div
              className="absolute inset-y-0 left-0 bg-[color:var(--brand)] transition-all duration-500 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
            {progress.percent < 100 && (
              <div className="ace-sweep absolute inset-0 pointer-events-none" />
            )}
          </div>

          {/* Step markers */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {steps.map((step, i) => {
              const done   = progress.percent >= step.threshold
              const active = !done && progress.percent >= step.threshold - 15
              return (
                <div
                  key={step.label}
                  className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em]"
                  style={{
                    color: done
                      ? 'var(--brand-deep)'
                      : active
                      ? 'var(--ink)'
                      : 'var(--ink-4)',
                  }}
                >
                  <span
                    className="w-[11px] h-[11px] flex items-center justify-center"
                    style={{
                      border: `1.5px solid ${done ? 'var(--brand)' : active ? 'var(--ink-2)' : 'var(--rule-2)'}`,
                      background: done ? 'var(--brand)' : 'transparent',
                      borderRadius: '2px',
                    }}
                  >
                    {done && (
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4l1.5 1.5L6.5 2" stroke="#063D29" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
