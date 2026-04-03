'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, User } from 'lucide-react'
import type { QuoteBuilderState, QuoteCalculation, PricingRecommendation } from '@/types'
import { MANAGED_PLANS } from '@/config/pricing'
import DatePicker from '@/components/DatePicker'

// ── Sales rep presets ─────────────────────────────────────────────────────────

const SALES_REPS = [
  { name: 'Gabriel Dalton',  email: 'gabriel@accessibilitychecker.org' },
  { name: 'Alex Rivera',     email: 'alex@accessibilitychecker.org'    },
  { name: 'Jordan Kim',      email: 'jordan@accessibilitychecker.org'  },
]

// ── Autofill helpers ──────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

function extractDomainFromEmail(email: string): string | null {
  const m = email.match(/@([\w.-]+\.[a-z]{2,})$/i)
  return m ? m[1].toLowerCase() : null
}

function extractDomainFromUrl(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function suggestEmails(contact: string, domain: string): string[] {
  const parts = contact.trim().split(/\s+/)
  if (parts.length < 2 || !domain) return []
  const first = slugify(parts[0])
  const last  = slugify(parts[parts.length - 1])
  if (!first || !last) return []
  return [
    `${first}${last}@${domain}`,
    `${first}.${last}@${domain}`,
    `${first[0]}${last}@${domain}`,
    `${first}@${domain}`,
  ]
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  quoteState: QuoteBuilderState
  quoteCalc: QuoteCalculation
  recommendation: PricingRecommendation
  onChange: (state: QuoteBuilderState) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuoteBuilder({ quoteState, quoteCalc, recommendation, onChange }: Props) {
  const update = (partial: Partial<QuoteBuilderState>) =>
    onChange({ ...quoteState, ...partial })

  const [repDropdownOpen, setRepDropdownOpen] = useState(false)

  // Derive best domain from available data
  const inferredDomain = useMemo(() => {
    if (quoteState.clientWebsite) {
      const d = extractDomainFromUrl(quoteState.clientWebsite)
      if (d) return d
    }
    if (quoteState.clientEmail) {
      const d = extractDomainFromEmail(quoteState.clientEmail)
      if (d) return d
    }
    return null
  }, [quoteState.clientWebsite, quoteState.clientEmail])

  // Email suggestions
  const emailSuggestions = useMemo(() => {
    if (!quoteState.clientContact || !inferredDomain) return []
    return suggestEmails(quoteState.clientContact, inferredDomain)
  }, [quoteState.clientContact, inferredDomain])

  // When client email is set/changed, offer to fill in the website
  function handleEmailBlur(email: string) {
    if (!email || quoteState.clientWebsite) return
    const domain = extractDomainFromEmail(email)
    if (domain) update({ clientEmail: email, clientWebsite: domain })
  }

  // When website is blurred, normalise and maybe fill email-domain suggestion
  function handleWebsiteBlur(url: string) {
    const domain = extractDomainFromUrl(url)
    if (domain) update({ clientWebsite: domain })
  }

  function selectRep(rep: { name: string; email: string }) {
    update({ salesRep: rep.name, salesEmail: rep.email })
    setRepDropdownOpen(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
          6
        </div>
        <h2 className="text-gray-900 font-semibold text-base">Quote Builder</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Live calculation</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* ── LEFT: Form fields ────────────────────────────────────────── */}
        <div className="space-y-5">

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

          {/* Extra Domains */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Additional Domains
              <span className="ml-1 text-gray-400 font-normal">(+15% base/mo each)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number" min={0} max={20}
                value={quoteState.extraDomains}
                onChange={(e) => update({ extraDomains: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer-checked:after:translate-x-5 peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
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
                type="number" min={0}
                value={quoteState.extraPdfPages}
                onChange={(e) => update({ extraPdfPages: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {quoteState.extraPdfPages > 0 && (
                <span className="text-xs text-gray-500 font-medium">= {fmt(quoteCalc.oneTimePdfCost)} one-time</span>
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
                type="number" min={0} max={10}
                value={quoteState.additionalVpats}
                onChange={(e) => update({ additionalVpats: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {quoteState.additionalVpats > 0 && (
                <span className="text-xs text-gray-500 font-medium">= {fmt(quoteCalc.oneTimeVpatCost)} one-time</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={quoteState.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Add quote notes, custom requirements, or client context…"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* ── CLIENT & PROPOSAL DETAILS ─────────────────────────────── */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Client &amp; Proposal Details
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Optional — populates the PDF proposal</p>
            </div>

            {/* Billing cycle */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Billing Cycle</label>
              <div className="flex gap-2">
                {(['monthly', 'annual'] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => update({ billingCycle: cycle })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      quoteState.billingCycle === cycle
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cycle === 'monthly' ? 'Monthly' : 'Annual (recommended)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Company + Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Company</label>
                <input
                  type="text"
                  value={quoteState.clientCompany}
                  onChange={(e) => update({ clientCompany: e.target.value })}
                  placeholder="CountryMax"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={quoteState.clientContact}
                  onChange={(e) => update({ clientContact: e.target.value })}
                  placeholder="Ethan Payne"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            {/* Client Email (with suggestions) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Client Email</label>
              <input
                type="email"
                value={quoteState.clientEmail}
                onChange={(e) => update({ clientEmail: e.target.value })}
                onBlur={(e) => handleEmailBlur(e.target.value)}
                placeholder="ethan@countrymax.com"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {/* Email suggestions */}
              {emailSuggestions.length > 0 && !quoteState.clientEmail && (
                <div className="mt-1.5">
                  <p className="text-xs text-gray-400 mb-1">Suggested:</p>
                  <div className="flex flex-wrap gap-1">
                    {emailSuggestions.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update({ clientEmail: s })}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full hover:bg-green-100 transition-colors font-mono"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phone + Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Phone</label>
                <input
                  type="tel"
                  value={quoteState.clientPhone}
                  onChange={(e) => update({ clientPhone: e.target.value })}
                  placeholder="555-000-1234"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Client Website</label>
                <input
                  type="text"
                  value={quoteState.clientWebsite}
                  onChange={(e) => update({ clientWebsite: e.target.value })}
                  onBlur={(e) => handleWebsiteBlur(e.target.value)}
                  placeholder="countrymax.com"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                {/* Suggest from email domain */}
                {!quoteState.clientWebsite && quoteState.clientEmail && inferredDomain && (
                  <button
                    type="button"
                    onClick={() => update({ clientWebsite: inferredDomain })}
                    className="mt-1 text-xs text-green-600 hover:underline"
                  >
                    Use {inferredDomain}
                  </button>
                )}
              </div>
            </div>

            {/* Sales Rep — combobox */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sales Representative</p>
              {/* Preset cards */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SALES_REPS.map((rep) => (
                  <button
                    key={rep.name}
                    type="button"
                    onClick={() => selectRep(rep)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      quoteState.salesRep === rep.name
                        ? 'bg-green-600 text-white border-green-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <User size={11} />
                    {rep.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rep Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={quoteState.salesRep}
                      onChange={(e) => update({ salesRep: e.target.value })}
                      onFocus={() => setRepDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setRepDropdownOpen(false), 150)}
                      placeholder="Gabriel Dalton"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 pr-6"
                    />
                    <ChevronDown size={11} className="absolute right-2 top-2 text-gray-400 pointer-events-none" />
                    {repDropdownOpen && (
                      <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {SALES_REPS.filter(r =>
                          !quoteState.salesRep || r.name.toLowerCase().includes(quoteState.salesRep.toLowerCase())
                        ).map(rep => (
                          <button
                            key={rep.name}
                            type="button"
                            onMouseDown={() => selectRep(rep)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 transition-colors"
                          >
                            <span className="font-medium text-gray-800">{rep.name}</span>
                            <span className="ml-2 text-gray-400">{rep.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rep Email</label>
                  <input
                    type="email"
                    value={quoteState.salesEmail}
                    onChange={(e) => update({ salesEmail: e.target.value })}
                    placeholder="gabriel@accessibilitychecker.org"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            </div>

            {/* Scope & Timeline */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Scope &amp; Timeline</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Start Date</label>
                  <DatePicker
                    value={quoteState.estimatedStart}
                    onChange={(iso) => update({ estimatedStart: iso })}
                    placeholder="Pick a start date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quote Valid Until</label>
                  <DatePicker
                    value={quoteState.quoteValidUntil}
                    onChange={(iso) => update({ quoteValidUntil: iso })}
                    placeholder="Pick expiry date"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Remediation Timeline</label>
                  <input
                    type="text"
                    value={quoteState.remediationTimeline}
                    onChange={(e) => update({ remediationTimeline: e.target.value })}
                    placeholder="4-8 weeks"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contract Duration</label>
                  <input
                    type="text"
                    value={quoteState.contractDuration}
                    onChange={(e) => update({ contractDuration: e.target.value })}
                    placeholder="12 months"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Special Discount (%)</label>
                  <input
                    type="number" min={0} max={100}
                    value={quoteState.discount}
                    onChange={(e) => update({ discount: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT: Live quote calculation ─────────────────────────────── */}
        <div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sticky top-20">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Live Quote
            </h3>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Monthly</div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base Plan</span>
                <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.baseMonthly)}/mo</span>
              </div>

              {quoteCalc.extraDomainCost > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Extra Domains ({quoteState.extraDomains})</span>
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

              {quoteCalc.totalOneTime > 0 && (
                <>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-1">One-Time</div>
                  {quoteCalc.oneTimePdfCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">PDF Pages ({quoteState.extraPdfPages} × $3)</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.oneTimePdfCost)}</span>
                    </div>
                  )}
                  {quoteCalc.oneTimeVpatCost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">VPATs ({quoteState.additionalVpats} × $500)</span>
                      <span className="text-sm font-medium text-gray-900">{fmt(quoteCalc.oneTimeVpatCost)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="mt-3 pt-3 border-t-2 border-green-200 bg-green-50 -mx-5 px-5 pb-2 rounded-b-xl">
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

          {quoteState.basePlan && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
              <p className="font-semibold mb-1">{quoteState.basePlan.name} — Plan Details</p>
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
