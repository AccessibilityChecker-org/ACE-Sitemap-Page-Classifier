export type PageType = 'template' | 'content' | 'unique' | 'dynamic'

export type PageCategory =
  | 'Product Pages'
  | 'Collection Pages'
  | 'Blog Posts'
  | 'Static Pages'
  | 'Homepage'
  | 'Blog Index'
  | 'Category Pages'
  | 'Search Pages'
  | 'Account Pages'
  | 'Checkout / Cart Pages'
  | 'Policy / Legal Pages'
  | 'Help Center / Docs Pages'
  | 'Landing Pages'
  | 'Other'

export type Platform =
  | 'Shopify'
  | 'WordPress'
  | 'Webflow'
  | 'Squarespace'
  | 'Magento'
  | 'BigCommerce'
  | 'Custom / Unknown'

export interface ClassifiedURL {
  url: string
  category: PageCategory
  pageType: PageType
  templateClusterId: string | null
  weightedValue: number
  notes: string
}

export interface CategoryGroup {
  category: PageCategory
  urls: ClassifiedURL[]
  templateCount: number
  contentCount: number
  uniqueCount: number
  dynamicCount: number
  rawCount: number
  weightedCount: number
  percentOfSite: number
  typeLabel: string
}

export interface AnalysisResult {
  domain: string
  platform: Platform
  platformConfidence: 'high' | 'medium' | 'low'
  rawPageCount: number
  assetUrlsFiltered: number
  templateTypesCount: number
  contentPagesCount: number
  uniquePagesCount: number
  dynamicPagesCount: number
  weightedPageCount: number
  categories: CategoryGroup[]
  allClassifiedUrls: ClassifiedURL[]
  weights: PageWeights
  analyzedAt: string
}

export interface PageWeights {
  template: number
  unique: number
  content: number
  dynamic: number
}

export interface ManagedPlan {
  name: string
  maxWeightedPages: number
  monthlyPrice: number
  annualPrice: number
  auditFrequency: string
  defaultPdfPages: number
  vpatIncluded: string
  teamDefault: string
}

export interface PricingRecommendation {
  weightedPlan: ManagedPlan | null
  rawPlan: ManagedPlan | null
  monthlyPrice: number
  annualPrice: number
  rawMonthlyPrice: number
  rawAnnualPrice: number
  annualSavings: number
  weightReductionPercent: number
  exceedsMaxTier: boolean
}

export interface QuoteBuilderState {
  basePlan: ManagedPlan | null
  extraDomains: number
  dedicatedTeam: boolean
  extraPdfPages: number
  additionalVpats: number
  notes: string
}

export interface QuoteCalculation {
  baseMonthly: number
  extraDomainCost: number
  dedicatedTeamCost: number
  monthlyTotal: number
  annualTotal: number
  oneTimePdfCost: number
  oneTimeVpatCost: number
  totalOneTime: number
  yearOneTotal: number
}

export interface AnalysisProgress {
  step: string
  detail: string
  percent: number
  isComplete: boolean
  isError: boolean
  errorMessage?: string
}
