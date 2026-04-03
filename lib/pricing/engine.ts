import type { ManagedPlan, PricingRecommendation, QuoteBuilderState, QuoteCalculation } from '@/types'
import { MANAGED_PLANS, ADD_ONS } from '@/config/pricing'

export function getPlanForPageCount(pageCount: number): ManagedPlan | null {
  const sortedPlans = [...MANAGED_PLANS].sort((a, b) => a.maxWeightedPages - b.maxWeightedPages)
  for (const plan of sortedPlans) {
    if (pageCount <= plan.maxWeightedPages) {
      return plan
    }
  }
  return null // exceeds max tier
}

export function getPricingRecommendation(
  weightedPageCount: number,
  rawPageCount: number
): PricingRecommendation {
  const weightedPlan = getPlanForPageCount(weightedPageCount)
  const rawPlan = getPlanForPageCount(rawPageCount)

  const monthlyPrice = weightedPlan?.monthlyPrice ?? 0
  const annualPrice = weightedPlan?.annualPrice ?? 0
  const rawMonthlyPrice = rawPlan?.monthlyPrice ?? 0
  const rawAnnualPrice = rawPlan?.annualPrice ?? 0

  const annualSavings = rawAnnualPrice - annualPrice
  const weightReductionPercent =
    rawPageCount > 0 ? Math.round((1 - weightedPageCount / rawPageCount) * 100) : 0

  return {
    weightedPlan,
    rawPlan,
    monthlyPrice,
    annualPrice,
    rawMonthlyPrice,
    rawAnnualPrice,
    annualSavings,
    weightReductionPercent,
    exceedsMaxTier: weightedPlan === null,
  }
}

export function calculateQuote(state: QuoteBuilderState): QuoteCalculation {
  const basePlan = state.basePlan
  const baseMonthly = basePlan?.monthlyPrice ?? 0

  const extraDomainCost =
    state.extraDomains > 0
      ? Math.round(baseMonthly * ADD_ONS.extraDomainPercentOfBase * state.extraDomains)
      : 0

  const dedicatedTeamCost = state.dedicatedTeam ? ADD_ONS.dedicatedTeamMonthly : 0

  const monthlyTotal = baseMonthly + extraDomainCost + dedicatedTeamCost
  const annualTotal = monthlyTotal * 12

  const oneTimePdfCost = state.extraPdfPages > 0
    ? state.extraPdfPages * ADD_ONS.extraPdfPageOneTime
    : 0

  const oneTimeVpatCost = state.additionalVpats > 0
    ? state.additionalVpats * ADD_ONS.additionalVpatOneTime
    : 0

  const totalOneTime = oneTimePdfCost + oneTimeVpatCost
  const yearOneTotal = annualTotal + totalOneTime

  return {
    baseMonthly,
    extraDomainCost,
    dedicatedTeamCost,
    monthlyTotal,
    annualTotal,
    oneTimePdfCost,
    oneTimeVpatCost,
    totalOneTime,
    yearOneTotal,
  }
}
