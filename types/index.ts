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
  | 'Brand Pages'
  | 'Plant / Database Pages'
  | 'Other'

export type Platform =
  | 'Shopify'
  | 'WordPress'
  | 'WooCommerce'
  | 'Webflow'
  | 'Squarespace'
  | 'Wix'
  | 'Magento'
  | 'BigCommerce'
  | 'PrestaShop'
  | 'Custom / Unknown'

export interface ClassifiedURL {
  url: string
  category: PageCategory
  pageType: PageType
  templateClusterId: string | null
  weightedValue: number
  notes: string
  /** 0–1 confidence score for this classification decision */
  confidence?: number
  /** Human-readable evidence notes explaining why this classification was made */
  reasoning?: string[]
  /** Which child sitemap this URL came from (e.g. "sitemap_products_1") */
  sourceSitemap?: string
  /** Dynamic interaction signals detected in this URL */
  dynamicSignals?: string[]
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
  /** Representative URL for this cluster (first template or dynamic URL) */
  representativeUrl?: string
  /** Human-readable explanation of why these URLs are grouped */
  clusterReasoning?: string
  /** Average confidence score across all URLs in this category */
  avgConfidence?: number
  /**
   * True when all pages in this category share the same layout (template family).
   * The "template" entry is a pricing abstraction — no single URL is the template.
   * The UI should render these as a Layout Family, not as "1 template + N content".
   */
  isFamilyGroup?: boolean
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
