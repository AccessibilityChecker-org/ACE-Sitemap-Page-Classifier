'use client'

import type { QuoteBuilderState, QuoteCalculation, PricingRecommendation } from '@/types'
import { MANAGED_PLANS } from '@/config/pricing'

interface Props {
  quoteState: QuoteBuilderState
  quoteCalc: QuoteCalculation
  recommendation: PricingRecommendation
  onChange: (state: QuoteBuilderState) => void
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function QuoteBuilder({ quoteState, quoteCalc, recommendation, onChange }: Props) {
  const update = (partial: Partial<QuoteBuilderState>) => {
    onChange({ ...quoteState, ...partial })
  }

  return (
    <div className="ace-panel">
      <div className="flex items-baseline gap-5 mb-6">
        <div className="ace-num">6</div>
        <div className="flex flex-col gap-0.5">
          <span className="ace-section-kicker">Section 6</span>
          <h2 className="ace-title">Quote Builder</h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Live calculation</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form fields */}
        <div className="space-y-4">
          {/* Base Plan */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Base Plan
              {recommendation.weightedPlan && (
                <span className="ml-2 text-green-600 font-normal">
                  (auto-selected: {recommendation.weightedPlan.name})
                </span>
              )}
            </label>
            <select
              value={quoteState.basePlan?.name ?? ''}
              onChange={(e) => {
                const plan = MANAGED_PLANS.find((p) => p.name === e.target.value) ?? null
                update({ basePlan: plan })
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            >
              <option value="">-- Select a plan --</option>
              {MANAGED_PLANS.map((plan) => (
                <option key={plan.name} value={plan.name}>
                  {plan.name} — {fmt(plan.monthlyPrice)}/mo (up to {plan.maxWeightedPages.toLocaleString()} pages)
                </option>
              ))}
            </select>
          </div>

          {/* Domains */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Number of Additional Domains
              <span className="ml-1 text-gray-400 font-normal">(+15% base/mo per domain)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={20}
                value={quoteState.extraDomains}
                onChange={(e) => update({ extraDomains: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {quoteState.extraDomains > 0 && quoteState.basePlan && (
                <span className="text-xs text-green-600 font-medium">
                  +{fmt(quoteCalc.extraDomainCost)}/mo
                </span>
              )}
            </div>
          </div>

          {/* Dedicated Team */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={quoteState.dedicatedTeam}
                  onChange={(e) => update({ dedicatedTeam: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700">Dedicated Team Upgrade</span>
                <span className="ml-2 text-xs text-gray-400">+$1,500/mo</span>
              </div>
            </label>
          </div>

          {/* Extra PDF Pages */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Extra PDF Pages (one-time)
              <span className="ml-1 text-gray-400 font-normal">($3/page)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                value={quoteState.extraPdfPages}
                onChange={(e) => update({ extraPdfPages: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {quoteState.extraPdfPages > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  = {fmt(quoteCalc.oneTimePdfCost)} one-time
                </span>
              )}
            </div>
          </div>

          {/* Additional VPATs */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Additional VPATs (one-time)
              <span className="ml-1 text-gray-400 font-normal">($500 each)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={10}
                value={quoteState.additionalVpats}
                onChange={(e) => update({ additionalVpats: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {quoteState.additionalVpats > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  = {fmt(quoteCalc.oneTimeVpatCost)} one-time
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={quoteState.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Add quote notes, custom requirements, or client context..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Live calculation */}
        <div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Live Quote Calculation
            </h3>

            <div className="space-y-2.5">
              {/* Monthly breakdown */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monthly</div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base Monthly</span>
                <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.baseMonthly)}/mo</span>
              </div>

              {quoteCalc.extraDomainCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Extra Domains ({quoteState.extraDomains})
                  </span>
                  <span className="text-sm font-medium text-gray-900">+{fmt(quoteCalc.extraDomainCost)}/mo</span>
                </div>
              )}

              {quoteCalc.dedicatedTeamCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dedicated Team</span>
                  <span className="text-sm font-medium text-gray-900">+{fmt(quoteCalc.dedicatedTeamCost)}/mo</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-bold text-gray-800">Monthly Total</span>
                <span className="text-xl font-black text-green-700">{fmt(quoteCalc.monthlyTotal)}/mo</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-sm font-bold text-gray-800">Annual Total</span>
                <span className="text-lg font-black text-green-700">{fmt(quoteCalc.annualTotal)}/yr</span>
              </div>

              {/* One-time fees */}
              {quoteCalc.totalOneTime > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-1">One-Time</div>

                  {quoteCalc.oneTimePdfCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        PDF Pages ({quoteState.extraPdfPages} × $3)
                      </span>
                      <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.oneTimePdfCost)}</span>
                    </div>
                  )}

                  {quoteCalc.oneTimeVpatCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        VPATs ({quoteState.additionalVpats} × $500)
                      </span>
                      <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.oneTimeVpatCost)}</span>
                    </div>
                  )}
                </>
              )}

              {/* Year 1 Total */}
              <div className="mt-3 pt-3 border-t-2 border-green-200 bg-green-50 -mx-5 px-5 pb-1 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-green-800">Year 1 Total</span>
                  <span className="text-2xl font-black text-green-700">{fmt(quoteCalc.yearOneTotal)}</span>
                </div>
                {quoteCalc.totalOneTime > 0 && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Includes {fmt(quoteCalc.totalOneTime)} one-time fees
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Plan details */}
          {quoteState.basePlan && (
            <div className="mt-3 p-3 bg-[color:var(--scan-soft)] rounded-lg border border-[color:var(--scan-soft)] text-xs text-[color:var(--scan)]">
              <p className="font-semibold mb-1">{quoteState.basePlan.name} Plan Details:</p>
              <p>Up to {quoteState.basePlan.maxWeightedPages.toLocaleString()} weighted pages</p>
              <p>Audit frequency: {quoteState.basePlan.auditFrequency}</p>
              <p>VPAT: {quoteState.basePlan.vpatIncluded}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
