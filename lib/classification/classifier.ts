import type { ClassifiedURL, CategoryGroup, PageCategory, PageType, PageWeights } from '@/types'
import { findMatchingRule } from './rules'
import { clusterByPattern } from '../template-clustering/clusterer'

const DYNAMIC_CATEGORIES: PageCategory[] = [
  'Search Pages',
  'Account Pages',
  'Checkout / Cart Pages',
]

const TEMPLATE_MIN_GROUP_SIZE = 3

export function classifyUrls(
  urls: string[],
  weights: PageWeights
): { classified: ClassifiedURL[]; categories: CategoryGroup[] } {
  // Step 1: Cluster all URLs by path pattern to identify templates
  const clusters = clusterByPattern(urls)

  // Step 2: Classify each URL
  const classified: ClassifiedURL[] = []

  for (const url of urls) {
    const rule = findMatchingRule(url)
    const category: PageCategory = rule ? rule.category : 'Other'
    const notes = rule ? rule.notes : 'No matching rule found'

    // Determine page type
    let pageType: PageType = 'unique'
    let templateClusterId: string | null = null

    // Check if this URL is in a cluster with other URLs
    for (const [pattern, clusterUrls] of Array.from(clusters.entries())) {
      if (clusterUrls.includes(url)) {
        templateClusterId = pattern
        if (DYNAMIC_CATEGORIES.includes(category)) {
          pageType = 'dynamic'
        } else if (clusterUrls.length >= TEMPLATE_MIN_GROUP_SIZE) {
          // This cluster has enough URLs to be template + content
          const isFirstInCluster = clusterUrls[0] === url
          pageType = isFirstInCluster ? 'template' : 'content'
        } else {
          pageType = 'unique'
        }
        break
      }
    }

    // Override for homepage
    if (category === 'Homepage') {
      pageType = 'unique'
    }
    // Override for blog index
    if (category === 'Blog Index') {
      pageType = 'unique'
    }

    const weightedValue = getWeightedValue(pageType, weights)

    classified.push({
      url,
      category,
      pageType,
      templateClusterId,
      weightedValue,
      notes,
    })
  }

  // Step 3: Group by category
  const categoryMap = new Map<PageCategory, ClassifiedURL[]>()
  for (const cu of classified) {
    const existing = categoryMap.get(cu.category) || []
    existing.push(cu)
    categoryMap.set(cu.category, existing)
  }

  // Step 4: Build CategoryGroup objects
  const categories: CategoryGroup[] = []
  const totalRaw = urls.length

  for (const [category, categoryUrls] of Array.from(categoryMap.entries())) {
    const templateCount = categoryUrls.filter((u: ClassifiedURL) => u.pageType === 'template').length
    const contentCount = categoryUrls.filter((u: ClassifiedURL) => u.pageType === 'content').length
    const uniqueCount = categoryUrls.filter((u: ClassifiedURL) => u.pageType === 'unique').length
    const dynamicCount = categoryUrls.filter((u: ClassifiedURL) => u.pageType === 'dynamic').length
    const rawCount = categoryUrls.length
    const weightedCount = Math.round(
      categoryUrls.reduce((sum: number, u: ClassifiedURL) => sum + u.weightedValue, 0)
    )
    const percentOfSite = totalRaw > 0 ? Math.round((rawCount / totalRaw) * 1000) / 10 : 0

    let typeLabel: string
    if (dynamicCount > 0 && templateCount === 0 && contentCount === 0 && uniqueCount === 0) {
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
    })
  }

  // Sort categories by raw count descending
  categories.sort((a, b) => b.rawCount - a.rawCount)

  return { classified, categories }
}

function getWeightedValue(pageType: PageType, weights: PageWeights): number {
  switch (pageType) {
    case 'template':
      return weights.template
    case 'content':
      return weights.content
    case 'unique':
      return weights.unique
    case 'dynamic':
      return weights.dynamic
    default:
      return weights.unique
  }
}

export function computeAnalysisSummary(classified: ClassifiedURL[]): {
  templateTypesCount: number
  contentPagesCount: number
  uniquePagesCount: number
  dynamicPagesCount: number
  weightedPageCount: number
} {
  // Count template types: number of distinct templateClusterIds that have a 'template' page
  const templateClusterIds = new Set<string>()
  let contentCount = 0
  let uniqueCount = 0
  let dynamicCount = 0
  let totalWeighted = 0

  for (const cu of classified) {
    totalWeighted += cu.weightedValue
    if (cu.pageType === 'template') {
      if (cu.templateClusterId) {
        templateClusterIds.add(cu.templateClusterId)
      }
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
    contentPagesCount: contentCount,
    uniquePagesCount: uniqueCount,
    dynamicPagesCount: dynamicCount,
    weightedPageCount: Math.round(totalWeighted),
  }
}
