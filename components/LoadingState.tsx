'use client'

import type { AnalysisProgress } from '@/types'

interface Props {
  progress: AnalysisProgress
}

export default function LoadingState({ progress }: Props) {
  if (progress.isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-semibold text-sm">Analysis Failed</h3>
            <p className="text-red-600 text-sm mt-1">{progress.errorMessage || 'An unexpected error occurred.'}</p>
            <p className="text-red-500 text-xs mt-2">Please check the sitemap URL or try pasting the XML directly.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <div className="flex flex-col items-center text-center">
        {/* Animated spinner */}
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-gray-900 font-semibold text-base mb-1">{progress.step}</h3>
        <p className="text-gray-500 text-sm mb-5">{progress.detail}</p>

        {/* Progress bar */}
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs font-semibold text-green-600">{progress.percent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {/* Steps indicator */}
        <div className="mt-5 flex gap-2 flex-wrap justify-center">
          {[
            { label: 'Fetch', threshold: 15 },
            { label: 'Parse', threshold: 30 },
            { label: 'Classify', threshold: 60 },
            { label: 'Price', threshold: 85 },
            { label: 'Done', threshold: 100 },
          ].map((step) => (
            <div
              key={step.label}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                progress.percent >= step.threshold
                  ? 'bg-green-100 text-green-700'
                  : progress.percent >= step.threshold - 15
                  ? 'bg-green-50 text-green-500 ring-1 ring-green-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {progress.percent >= step.threshold && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
