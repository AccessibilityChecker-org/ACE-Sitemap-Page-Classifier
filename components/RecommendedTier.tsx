'use client'

import type { AnalysisResult, PricingRecommendation } from '@/types'

interface Props {
  analysis: AnalysisResult
  recommendation: PricingRecommendation
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function RecommendedTier({ analysis, recommendation }: Props) {
  // Reduction metrics — computed from the current scan, not hard-coded.
  const pageReductionPercent =
    analysis.rawPageCount > 0
      ? (1 - analysis.weightedPageCount / analysis.rawPageCount) * 100
      : 0
  const costReductionPercent =
    recommendation.rawAnnualPrice > 0
      ? (1 - recommendation.annualPrice / recommendation.rawAnnualPrice) * 100
      : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
          5
        </div>
        <h2 className="text-gray-900 font-semibold text-base">Recommended Tier</h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: Stats and Recommendation */}
        <div className="space-y-3">
          {/* Stats rows */}
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Raw Page Count</span>
              <span className="font-semibold text-gray-900">{analysis.rawPageCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Weighted Page Count</span>
              <div className="text-right">
                <span className="font-bold text-green-700 text-lg">{analysis.weightedPageCount.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-1">weighted pages</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Weight Reduction</span>
              <span className="font-bold text-green-600">
                {recommendation.weightReductionPercent}% fewer effective pages
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Recommended Tier</span>
              <div className="flex items-center gap-2">
                {recommendation.weightedPlan ? (
                  <span className="inline-flex px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-lg">
                    {recommendation.weightedPlan.name}
                  </span>
                ) : (
                  <span className="inline-flex px-3 py-1 bg-gray-700 text-white text-sm font-bold rounded-lg">
                    Custom Enterprise
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            {recommendation.weightedPlan ? (
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-green-600">
                    {fmt(recommendation.monthlyPrice)}
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {fmt(recommendation.annualPrice)}/yr &bull; {fmt(recommendation.monthlyPrice / 12 * 12 / 12)}/mo effective
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Up to</div>
                  <div className="font-bold text-gray-900">
                    {recommendation.weightedPlan.maxWeightedPages.toLocaleString()} pages
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                This site exceeds our largest tier (50,000 weighted pages). Please prepare a custom Enterprise quote.
              </div>
            )}
          </div>
        </div>

        {/* Right: Savings Comparison */}
        <div className="space-y-3">
          {recommendation.rawPlan && recommendation.annualSavings > 0 && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Without Weighted Pricing
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">Raw-count tier would be:</span>
                  <span className="text-sm font-bold text-amber-900">{recommendation.rawPlan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">Monthly price:</span>
                  <span className="text-sm font-bold text-amber-900">{fmt(recommendation.rawMonthlyPrice)}/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700">Annual price:</span>
                  <span className="text-sm font-bold text-amber-900">{fmt(recommendation.rawAnnualPrice)}/yr</span>
                </div>
              </div>
            </div>
          )}

          {recommendation.annualSavings > 0 && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-green-800">Client Saves</span>
              </div>
              <div className="text-3xl font-black text-green-700 mb-1">
                {fmt(recommendation.annualSavings)}/yr
              </div>
              <p className="text-xs text-green-600">
                with weighted pricing vs. raw-count pricing
              </p>
            </div>
          )}

          {/* Reductions Summary — Page Reduction + Cost Reduction side-by-side */}
          {(pageReductionPercent > 0 || costReductionPercent > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-sm font-bold text-blue-800">Page Reduction</span>
                </div>
                <div className="text-3xl font-black text-blue-700 mb-1">
                  {pageReductionPercent.toFixed(1)}%
                </div>
                <p className="text-xs text-blue-600">
                  {analysis.rawPageCount.toLocaleString()} raw &rarr;{' '}
                  {analysis.weightedPageCount.toLocaleString()} weighted
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-sm font-bold text-emerald-800">Cost Reduction</span>
                </div>
                <div className="text-3xl font-black text-emerald-700 mb-1">
                  {costReductionPercent.toFixed(1)}%
                </div>
                <p className="text-xs text-emerald-600">
                  {fmt(recommendation.rawAnnualPrice)} &rarr; {fmt(recommendation.annualPrice)}/yr
                </p>
              </div>
            </div>
          )}

          {/* Pitch helper */}
          {recommendation.weightedPlan && recommendation.rawPlan && recommendation.annualSavings > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Use this in your pitch:</p>
              <p className="text-xs text-gray-700 italic leading-relaxed">
                &ldquo;Your {analysis.rawPageCount.toLocaleString()} pages reduce to just {analysis.weightedPageCount.toLocaleString()} weighted pages under our
                template-aware pricing model. That puts you on the {recommendation.weightedPlan.name} plan
                at {fmt(recommendation.monthlyPrice)}/mo — saving you {fmt(recommendation.annualSavings)} per year
                vs. standard per-page pricing.&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
