/**
 * ACE™ Classification Engine — 6-Layer Decision System
 *
 * Layer 1 — Source context (child sitemap label)
 * Layer 2 — URL pattern rules
 * Layer 3 — Platform-aware interpretation (handled upstream in detector)
 * Layer 4 — Structural template clustering
 * Layer 5 — Dynamicity analysis
 * Layer 6 — Final decision with confidence + reasoning
 *
 * Core principle: different content ≠ different template.
 * Brand pages, product pages, category pages, plant/database pages, etc.
 * that share the same layout are ONE template + many content pages,
 * regardless of how the data (names, images, descriptions) differs.
 */

import type { ClassifiedURL, CategoryGroup, PageCategory, PageType, PageWeights } from '@/types'
import { findMatchingRule } from './rules'
import { clusterByPattern } from '../template-clustering/clusterer'
import { largestRemainderPercentages } from '../utils/percentages'

// ─── Category behaviour tables ───────────────────────────────────────────────

/**
 * Categories where ALL pages are the same template family.
 * First URL = template, all others = content.
 * Rationale: these pages differ only in data (product name, brand, plant species, etc.)
 * They share the same DOM structure, navigation, breadcrumbs, grid/detail layout.
 */
const SINGLE_TEMPLATE_FAMILY_CATEGORIES: ReadonlySet<PageCategory> = new Set([
  'Product Pages',
  'Collection Pages',
  'Category Pages',
  'Brand Pages',
  'Plant / Database Pages',
  'Blog Posts',
])

/**
 * Categories where every page requires interactive accessibility testing.
 * Always classified as dynamic (weight 1.2).
 */
const ALWAYS_DYNAMIC_CATEGORIES: ReadonlySet<PageCategory> = new Set([
  'Search Pages',
  'Account Pages',
  'Checkout / Cart Pages',
])

/**
 * Categories where every page is genuinely unique (no template pattern).
 * Always classified as unique (weight 1.0).
 */
const ALWAYS_UNIQUE_CATEGORIES: ReadonlySet<PageCategory> = new Set([
  'Homepage',
  'Blog Index',
])

// ─── Layer 1: Source sitemap signals ─────────────────────────────────────────

/**
 * Maps child sitemap label patterns → category hints.
 * These are used to reinforce or correct URL pattern matching
 * when the URL itself is ambiguous.
 */
const SITEMAP_LABEL_SIGNALS: Array<{ pattern: RegExp; category: PageCategory; confidence: number }> = [
  // XML child sitemap names (sitemap_products_1.xml → "sitemap_products_1")
  // AND HTML sitemap section headings (h2 "Brands" → "brands", li > strong "Categories" → "categories")
  { pattern: /product/i,    category: 'Product Pages',          confidence: 0.85 },
  { pattern: /collection/i, category: 'Collection Pages',       confidence: 0.85 },
  { pattern: /categor/i,    category: 'Category Pages',         confidence: 0.80 },
  { pattern: /^brands?$/i,  category: 'Brand Pages',            confidence: 0.90 },
  { pattern: /brand/i,      category: 'Brand Pages',            confidence: 0.85 },
  { pattern: /manufactur/i, category: 'Brand Pages',            confidence: 0.80 },
  { pattern: /^blogs?$/i,   category: 'Blog Posts',             confidence: 0.90 },
  { pattern: /blog/i,       category: 'Blog Posts',             confidence: 0.80 },
  { pattern: /news/i,       category: 'Blog Posts',             confidence: 0.70 },
  { pattern: /article/i,    category: 'Blog Posts',             confidence: 0.75 },
  { pattern: /plant/i,      category: 'Plant / Database Pages', confidence: 0.85 },
  { pattern: /species/i,    category: 'Plant / Database Pages', confidence: 0.85 },
  { pattern: /glossar/i,    category: 'Plant / Database Pages', confidence: 0.80 },
  // HTML section headings for static/legal pages
  { pattern: /^pages?$/i,   category: 'Static Pages',           confidence: 0.65 },
  { pattern: /^legal$/i,    category: 'Policy / Legal Pages',   confidence: 0.80 },
  { pattern: /^polic/i,     category: 'Policy / Legal Pages',   confidence: 0.80 },
  { pattern: /^help$/i,     category: 'Help Center / Docs Pages', confidence: 0.80 },
  { pattern: /^support$/i,  category: 'Help Center / Docs Pages', confidence: 0.75 },
]

function getSitemapLabelSignal(
  label: string
): { category: PageCategory; confidence: number } | null {
  for (const signal of SITEMAP_LABEL_SIGNALS) {
    if (signal.pattern.test(label)) {
      return { category: signal.category, confidence: signal.confidence }
    }
  }
  return null
}

// ─── Layer 5: Dynamicity signals ─────────────────────────────────────────────

/**
 * URL-level signals that indicate a page requires interactive testing.
 * These can upgrade an otherwise static page to dynamic.
 */
const DYNAMIC_URL_SIGNALS: Array<{ pattern: RegExp; signal: string }> = [
  { pattern: /[?&]filter/i,           signal: 'faceted filter parameter' },
  { pattern: /[?&]sort/i,             signal: 'sort parameter' },
  { pattern: /[?&]facet/i,            signal: 'facet parameter' },
  { pattern: /[?&]min[_-]price/i,     signal: 'price range filter' },
  { pattern: /[?&]max[_-]price/i,     signal: 'price range filter' },
  { pattern: /[?&]ajax/i,             signal: 'AJAX-driven content' },
  { pattern: /\/configurator\/?/i,    signal: 'product configurator' },
  { pattern: /\/store-?locator\/?/i,  signal: 'store locator map' },
  { pattern: /\/find-a?-?store\/?/i,  signal: 'store finder' },
  { pattern: /\/compare\/?(\?|$)/i,   signal: 'compare tool' },
  { pattern: /\/wishlist\.php/i,      signal: 'wishlist functionality' },
  { pattern: /\/subscribe\/?(\?|$)/i, signal: 'subscription flow' },
]

function detectDynamicSignals(url: string): string[] {
  return DYNAMIC_URL_SIGNALS.filter(({ pattern }) => pattern.test(url)).map(({ signal }) => signal)
}

// ─── Weighted value helper ────────────────────────────────────────────────────

function getWeightedValue(pageType: PageType, weights: PageWeights): number {
  switch (pageType) {
    case 'template': return weights.template
    case 'content':  return weights.content
    case 'unique':   return weights.unique
    case 'dynamic':  return weights.dynamic
    default:         return weights.unique
  }
}

// ─── Main classification function ────────────────────────────────────────────

export function classifyUrls(
  urls: string[],
  weights: PageWeights,
  /** Optional map of url → child sitemap label (e.g. "sitemap_products_1") */
  sourceSitemapMap?: Map<string, string>
): { classified: ClassifiedURL[]; categories: CategoryGroup[] } {

  // ── LAYER 2 + 1: Assign category to each URL ────────────────────────────
  // URL pattern rule wins unless it returns 'Other', in which case the source
  // sitemap label can provide a better category signal.

  const urlCategories  = new Map<string, PageCategory>()
  const urlRuleNotes   = new Map<string, string>()
  const urlRuleHit     = new Map<string, boolean>()

  for (const url of urls) {
    const rule = findMatchingRule(url)
    let category: PageCategory = rule?.category ?? 'Other'
    const notes   = rule?.notes ?? 'No URL pattern matched'
    const ruleHit = rule !== null

    // Layer 1: source sitemap can upgrade 'Other' or corroborate a weak match
    if (category === 'Other' && sourceSitemapMap) {
      const sitemapLabel = sourceSitemapMap.get(url) ?? ''
      const sitemapSignal = getSitemapLabelSignal(sitemapLabel)
      if (sitemapSignal) {
        category = sitemapSignal.category
      }
    }

    urlCategories.set(url, category)
    urlRuleNotes.set(url, notes)
    urlRuleHit.set(url, ruleHit)
  }

  // ── Group URLs by category ───────────────────────────────────────────────
  const categoryGroups = new Map<PageCategory, string[]>()
  for (const url of urls) {
    const cat = urlCategories.get(url)!
    const existing = categoryGroups.get(cat) ?? []
    existing.push(url)
    categoryGroups.set(cat, existing)
  }

  // ── LAYER 4: Pattern-cluster non-template-family categories ─────────────
  const patternClusters = clusterByPattern(urls)

  // ── LAYER 5 + 6: Classify each URL ──────────────────────────────────────
  const classified: ClassifiedURL[] = []

  for (const url of urls) {
    const category      = urlCategories.get(url)!
    const notes         = urlRuleNotes.get(url)!
    const ruleHit       = urlRuleHit.get(url)!
    const sitemapLabel  = sourceSitemapMap?.get(url) ?? ''
    const dynamicSignals = detectDynamicSignals(url)

    let pageType: PageType       = 'unique'
    let templateClusterId: string | null = null
    const reasoning: string[]   = []
    let confidence               = 0.50

    // ── Add URL rule evidence ─────────────────────────────────────────────
    if (ruleHit) {
      reasoning.push(`URL pattern matched: ${notes}`)
      confidence += 0.20
    }

    // ── Add source sitemap evidence ───────────────────────────────────────
    if (sitemapLabel) {
      const sitemapSignal = getSitemapLabelSignal(sitemapLabel)
      if (sitemapSignal && sitemapSignal.category === category) {
        reasoning.push(`Source sitemap confirms category: "${sitemapLabel}"`)
        confidence += 0.10
      } else if (sitemapLabel) {
        reasoning.push(`Source sitemap: "${sitemapLabel}"`)
      }
    }

    // ── LAYER 5: Dynamic URL signal override ─────────────────────────────
    // Dynamic signals can upgrade pages to dynamic UNLESS the page is already
    // in a template family category (products, brands, etc.) — those still get
    // template/content treatment even if they have filter params.
    const hasStrongDynamicSignal = dynamicSignals.length > 0
    const isTemplateFamilyCategory = SINGLE_TEMPLATE_FAMILY_CATEGORIES.has(category)

    if (hasStrongDynamicSignal && !isTemplateFamilyCategory && !ALWAYS_UNIQUE_CATEGORIES.has(category)) {
      pageType = 'dynamic'
      reasoning.push(`Dynamic interaction signals detected: ${dynamicSignals.join(', ')}`)
      confidence = Math.min(confidence + 0.15, 0.95)
    }

    // ── LAYER 6: Final classification decision ────────────────────────────

    if (ALWAYS_DYNAMIC_CATEGORIES.has(category)) {
      // ── Dynamic category: all pages require interactive testing ──────
      pageType = 'dynamic'
      templateClusterId = `dynamic:${category}`
      reasoning.push(`Category "${category}" always requires interactive accessibility testing`)
      confidence = Math.max(confidence, 0.90)

    } else if (ALWAYS_UNIQUE_CATEGORIES.has(category)) {
      // ── Unique category: these pages are one-of-a-kind ──────────────
      pageType = 'unique'
      reasoning.push(`Category "${category}" is a singular page — always unique`)
      confidence = Math.max(confidence, 0.95)

    } else if (pageType !== 'dynamic' && SINGLE_TEMPLATE_FAMILY_CATEGORIES.has(category)) {
      // ── Template family: same layout, different data ─────────────────
      // This is the key rule for ecommerce/catalog sites.
      // Different product names, brand names, plant species, blog titles =
      // different CONTENT, not different templates.
      const categoryUrls = categoryGroups.get(category)!

      if (categoryUrls.length === 1) {
        pageType = 'unique'
        reasoning.push(
          `Only 1 page found in "${category}" — classified unique (not enough siblings to form a template family)`
        )
        confidence = Math.max(confidence, 0.65)
      } else {
        // First URL in the category order = template representative
        const isFirstInCategory = categoryUrls[0] === url
        pageType = isFirstInCategory ? 'template' : 'content'
        templateClusterId = `family:${category}`

        if (isFirstInCategory) {
          reasoning.push(
            `Representative template for "${category}" family (${categoryUrls.length} total pages)`
          )
          reasoning.push(
            `Audited as 1 full template — remaining ${categoryUrls.length - 1} pages share this structure`
          )
        } else {
          reasoning.push(
            `Shares "${category}" template layout — content differs (data-only: name, text, images)`
          )
          reasoning.push(`Template representative: ${categoryUrls[0]}`)
          reasoning.push(
            `Content pages in family: ${categoryUrls.length - 1} (audited at content weight only)`
          )
        }
        confidence = Math.max(confidence, 0.85)
      }

    } else if (pageType !== 'dynamic') {
      // ── All other categories: use path-pattern clustering ────────────
      // Static Pages, Landing Pages, Policy, Help, Other
      let foundCluster = false

      for (const [pattern, clusterUrls] of Array.from(patternClusters.entries())) {
        if (!clusterUrls.includes(url)) continue

        templateClusterId = pattern
        foundCluster = true

        if (clusterUrls.length >= 3) {
          const isFirst = clusterUrls[0] === url
          pageType = isFirst ? 'template' : 'content'

          if (isFirst) {
            reasoning.push(
              `First URL in path-pattern cluster with ${clusterUrls.length} similar pages`
            )
            reasoning.push(`Cluster pattern: "${pattern}"`)
          } else {
            reasoning.push(
              `Shares URL pattern with cluster (${clusterUrls.length} pages, pattern: "${pattern}")`
            )
          }
          confidence = Math.max(confidence, 0.72)
        } else {
          pageType = 'unique'
          reasoning.push(
            `URL pattern cluster has only ${clusterUrls.length} member(s) — below template threshold (3)`
          )
          reasoning.push(`Classified as unique — insufficient siblings to justify a template`)
          confidence = Math.max(confidence, 0.60)
        }
        break
      }

      if (!foundCluster) {
        pageType = 'unique'
        reasoning.push('No URL pattern cluster found — classified as unique')
        confidence = Math.max(confidence, 0.55)
      }
    }

    classified.push({
      url,
      category,
      pageType,
      templateClusterId,
      weightedValue: getWeightedValue(pageType, weights),
      notes,
      confidence: Math.min(Math.round(confidence * 100) / 100, 1.0),
      reasoning,
      sourceSitemap: sitemapLabel || undefined,
      dynamicSignals: dynamicSignals.length > 0 ? dynamicSignals : undefined,
    })
  }

  // ── Build CategoryGroup objects ──────────────────────────────────────────
  const categoryMap = new Map<PageCategory, ClassifiedURL[]>()
  for (const cu of classified) {
    const existing = categoryMap.get(cu.category) ?? []
    existing.push(cu)
    categoryMap.set(cu.category, existing)
  }

  const categories: CategoryGroup[] = []
  const totalRaw = urls.length

  for (const [category, categoryUrls] of Array.from(categoryMap.entries())) {
    const templateCount = categoryUrls.filter((u) => u.pageType === 'template').length
    const contentCount  = categoryUrls.filter((u) => u.pageType === 'content').length
    const uniqueCount   = categoryUrls.filter((u) => u.pageType === 'unique').length
    const dynamicCount  = categoryUrls.filter((u) => u.pageType === 'dynamic').length
    const rawCount      = categoryUrls.length
    const weightedCount = Math.round(
      categoryUrls.reduce((sum, u) => sum + u.weightedValue, 0)
    )
    // Exact share here; final display value is replaced below using the
    // largest-remainder method so all categories sum to exactly 100%.
    const percentOfSite = totalRaw > 0 ? (rawCount / totalRaw) * 100 : 0
    const avgConfidence =
      rawCount > 0
        ? Math.round(
            (categoryUrls.reduce((s, u) => s + (u.confidence ?? 0.5), 0) / rawCount) * 100
          ) / 100
        : 0.5

    const representativeUrl =
      categoryUrls.find((u) => u.pageType === 'template')?.url ??
      categoryUrls.find((u) => u.pageType === 'dynamic')?.url ??
      categoryUrls[0]?.url

    // Is this a single-template-family group?
    const isFamilyGroup =
      SINGLE_TEMPLATE_FAMILY_CATEGORIES.has(category) && templateCount === 1 && contentCount > 0

    // Build a human-readable cluster explanation
    let clusterReasoning = ''
    if (isFamilyGroup) {
      clusterReasoning =
        `All ${rawCount.toLocaleString()} URLs share the same page layout — ` +
        `navigation, structure, regions, and components are identical across every page. ` +
        `Only the data changes (names, images, descriptions, prices). ` +
        `Priced as: 1 full layout audit (×${weights.template}) + ` +
        `${contentCount.toLocaleString()} content-only checks (×${weights.content} each) = ` +
        `${weightedCount.toLocaleString()} weighted pages total.`
    } else if (ALWAYS_DYNAMIC_CATEGORIES.has(category)) {
      clusterReasoning =
        `All ${rawCount} pages in "${category}" require interactive accessibility testing ` +
        `(filters, forms, account flows, AJAX-driven state, or checkout steps).`
    } else if (templateCount > 0 && contentCount > 0) {
      clusterReasoning =
        `URL pattern clustering identified ${templateCount} distinct layout template${templateCount !== 1 ? 's' : ''} ` +
        `and ${contentCount} content pages sharing those path structures. ` +
        `Template pages cover the shared layout; content pages differ only in copy.`
    } else if (uniqueCount === rawCount) {
      clusterReasoning =
        `These ${rawCount} pages are classified as unique — each has a materially different layout ` +
        `or insufficient siblings to form a template family.`
    }

    // Type label for UI — family groups get a clearer description
    let typeLabel: string
    if (isFamilyGroup) {
      typeLabel = `${rawCount.toLocaleString()} page layout family`
    } else if (dynamicCount > 0 && templateCount === 0 && contentCount === 0 && uniqueCount === 0) {
      typeLabel = `${dynamicCount} dynamic`
    } else if (templateCount > 0 && contentCount > 0) {
      typeLabel = `${templateCount} template + ${contentCount} content`
    } else if (uniqueCount > 0 && templateCount === 0 && contentCount === 0) {
      typeLabel = uniqueCount === 1 ? 'unique' : `${uniqueCount} unique`
    } else if (templateCount > 0) {
      typeLabel = `${templateCount} template`
    } else if (contentCount > 0) {
      typeLabel = `${contentCount} content`
    } else {
      typeLabel = 'unique'
    }

    categories.push({
      category,
      urls: categoryUrls,
      templateCount,
      contentCount,
      uniqueCount,
      dynamicCount,
      rawCount,
      weightedCount,
      percentOfSite,
      typeLabel,
      representativeUrl,
      clusterReasoning,
      avgConfidence,
      isFamilyGroup,
    })
  }

  // Sort by raw count descending
  categories.sort((a, b) => b.rawCount - a.rawCount)

  // Apply Hamilton's largest-remainder method so displayed percentOfSite values
  // always sum to exactly 100% (at 1-decimal precision), avoiding 99.9% / 100.1%
  // artifacts from independent per-category rounding.
  if (totalRaw > 0 && categories.length > 0) {
    const balanced = largestRemainderPercentages(
      categories.map((c) => c.rawCount),
      1
    )
    for (let i = 0; i < categories.length; i++) {
      categories[i].percentOfSite = balanced[i]
    }
  }

  return { classified, categories }
}

// ─── Summary aggregation ──────────────────────────────────────────────────────

export function computeAnalysisSummary(classified: ClassifiedURL[]): {
  templateTypesCount: number
  contentPagesCount: number
  uniquePagesCount: number
  dynamicPagesCount: number
  weightedPageCount: number
} {
  const templateClusterIds = new Set<string>()
  let contentCount  = 0
  let uniqueCount   = 0
  let dynamicCount  = 0
  let totalWeighted = 0

  for (const cu of classified) {
    totalWeighted += cu.weightedValue
    if (cu.pageType === 'template') {
      if (cu.templateClusterId) templateClusterIds.add(cu.templateClusterId)
    } else if (cu.pageType === 'content') {
      contentCount++
    } else if (cu.pageType === 'unique') {
      uniqueCount++
    } else if (cu.pageType === 'dynamic') {
      dynamicCount++
    }
  }

  return {
    templateTypesCount: templateClusterIds.size,
    contentPagesCount:  contentCount,
    uniquePagesCount:   uniqueCount,
    dynamicPagesCount:  dynamicCount,
    weightedPageCount:  Math.round(totalWeighted),
  }
}
