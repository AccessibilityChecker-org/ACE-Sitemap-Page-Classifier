import { parseSitemapXml, deduplicateUrls } from './parser'

const MAX_CHILD_SITEMAPS = 75    // max child sitemaps to follow per index
const MAX_RECURSION_DEPTH = 3    // max nested sitemap index depth
const FETCH_TIMEOUT_MS = 15000

export interface FetchedSitemapResult {
  urls: string[]
  /** Maps each URL to the label of the child sitemap it came from */
  urlSourceMap: Map<string, string>
  assetUrlsFiltered: number
  subSitemapsTotal: number
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ACE-Sitemap-Classifier/1.0 (AccessibilityChecker.org)',
        Accept: 'application/xml,text/xml,application/x-gzip,*/*',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Extract a short human-readable label from a sitemap URL.
 * e.g. https://example.com/sitemap_products_1.xml → "sitemap_products_1"
 *      https://example.com/sitemaps/blog-sitemap.xml → "blog-sitemap"
 */
function extractSitemapLabel(url: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const filename = segments[segments.length - 1] || ''
    // Strip extension
    return filename.replace(/\.(xml|txt|gz|php)$/i, '') || 'sitemap'
  } catch {
    return 'sitemap'
  }
}

/**
 * Recursively fetch a sitemap URL, following child sitemaps if it's a sitemapindex.
 * Returns all page URLs with their source sitemap labels.
 */
async function fetchSitemapRecursive(
  sitemapUrl: string,
  label: string,
  depth: number,
  visitedSitemaps: Set<string>,
  urlSourceMap: Map<string, string>,
  onProgress: (step: string, detail: string, percent: number) => void,
  progressBase: number,
  progressRange: number
): Promise<{ urls: string[]; assetsFiltered: number; childCount: number }> {
  if (depth > MAX_RECURSION_DEPTH) {
    console.warn(`Max recursion depth reached for ${sitemapUrl}`)
    return { urls: [], assetsFiltered: 0, childCount: 0 }
  }

  const normalisedSitemapUrl = sitemapUrl.toLowerCase().split('?')[0]
  if (visitedSitemaps.has(normalisedSitemapUrl)) {
    return { urls: [], assetsFiltered: 0, childCount: 0 }
  }
  visitedSitemaps.add(normalisedSitemapUrl)

  let xmlContent: string
  try {
    xmlContent = await fetchWithTimeout(sitemapUrl)
  } catch (err) {
    console.warn(`Failed to fetch sitemap ${sitemapUrl}:`, err)
    return { urls: [], assetsFiltered: 0, childCount: 0 }
  }

  const parsed = parseSitemapXml(xmlContent)

  if (parsed.type === 'sitemapindex') {
    // This is an index — recurse into child sitemaps
    const childUrls = parsed.sitemapUrls.slice(0, MAX_CHILD_SITEMAPS)
    const totalChildren = childUrls.length
    const allUrls: string[] = []
    let totalAssetsFiltered = 0

    for (let i = 0; i < childUrls.length; i++) {
      const childUrl = childUrls[i]
      const childLabel = extractSitemapLabel(childUrl)
      const childProgress = progressBase + Math.floor((i / totalChildren) * progressRange)

      onProgress(
        'Fetching sub-sitemaps',
        `[${i + 1}/${totalChildren}] ${childLabel}`,
        childProgress
      )

      const childResult = await fetchSitemapRecursive(
        childUrl,
        childLabel,
        depth + 1,
        visitedSitemaps,
        urlSourceMap,
        onProgress,
        childProgress,
        Math.floor(progressRange / totalChildren)
      )

      // Tag each URL with its source label
      for (const url of childResult.urls) {
        if (!urlSourceMap.has(url)) {
          urlSourceMap.set(url, childLabel)
        }
      }

      allUrls.push(...childResult.urls)
      totalAssetsFiltered += childResult.assetsFiltered
    }

    return { urls: allUrls, assetsFiltered: totalAssetsFiltered, childCount: totalChildren }
  }

  // Regular urlset — tag all URLs with this sitemap's label
  for (const url of parsed.urls) {
    if (!urlSourceMap.has(url)) {
      urlSourceMap.set(url, label)
    }
  }

  return {
    urls: parsed.urls,
    assetsFiltered: parsed.assetUrlsFiltered,
    childCount: 0,
  }
}

export async function fetchSitemapUrls(
  sitemapUrl: string,
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<FetchedSitemapResult> {
  onProgress('Fetching sitemap', `Downloading ${sitemapUrl}`, 5)

  const urlSourceMap = new Map<string, string>()
  const visitedSitemaps = new Set<string>()

  let xmlContent: string
  try {
    xmlContent = await fetchWithTimeout(sitemapUrl)
  } catch (err) {
    throw new Error(
      `Failed to fetch sitemap: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  onProgress('Parsing sitemap', 'Detecting sitemap structure', 15)
  const parsed = parseSitemapXml(xmlContent)

  let allUrls: string[] = []
  let totalAssetsFiltered = 0
  let subSitemapsTotal = 0

  if (parsed.type === 'sitemapindex') {
    const childSitemapUrls = parsed.sitemapUrls.slice(0, MAX_CHILD_SITEMAPS)
    subSitemapsTotal = childSitemapUrls.length

    onProgress(
      'Sitemap index detected',
      `Found ${subSitemapsTotal} child sitemaps — fetching all`,
      20
    )

    // Mark root as visited to avoid circular reference
    visitedSitemaps.add(sitemapUrl.toLowerCase().split('?')[0])

    for (let i = 0; i < childSitemapUrls.length; i++) {
      const childUrl = childSitemapUrls[i]
      const childLabel = extractSitemapLabel(childUrl)
      const progressPercent = 20 + Math.floor((i / subSitemapsTotal) * 65)

      onProgress(
        'Fetching sub-sitemaps',
        `[${i + 1}/${subSitemapsTotal}] ${childLabel}`,
        progressPercent
      )

      const childResult = await fetchSitemapRecursive(
        childUrl,
        childLabel,
        1,
        visitedSitemaps,
        urlSourceMap,
        onProgress,
        progressPercent,
        Math.floor(65 / subSitemapsTotal)
      )

      for (const url of childResult.urls) {
        if (!urlSourceMap.has(url)) {
          urlSourceMap.set(url, childLabel)
        }
      }

      allUrls.push(...childResult.urls)
      totalAssetsFiltered += childResult.assetsFiltered
    }
  } else {
    // Single urlset — label all URLs with the root sitemap name
    const rootLabel = extractSitemapLabel(sitemapUrl)
    for (const url of parsed.urls) {
      urlSourceMap.set(url, rootLabel)
    }
    allUrls = parsed.urls
    totalAssetsFiltered = parsed.assetUrlsFiltered
  }

  onProgress('Deduplicating URLs', `Processing ${allUrls.length} raw URLs`, 87)
  const deduplicated = deduplicateUrls(allUrls)

  // Rebuild the source map using the deduplicated canonical URLs
  // (deduplication keeps the first occurrence, so the map should already be consistent)
  const deduplicatedSourceMap = new Map<string, string>()
  for (const url of deduplicated) {
    const label = urlSourceMap.get(url)
    if (label) deduplicatedSourceMap.set(url, label)
  }

  onProgress('Complete', `Found ${deduplicated.length} unique pages`, 95)

  return {
    urls: deduplicated,
    urlSourceMap: deduplicatedSourceMap,
    assetUrlsFiltered: totalAssetsFiltered,
    subSitemapsTotal,
  }
}
