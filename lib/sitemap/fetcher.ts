import { parseSitemapXml, deduplicateUrls } from './parser'
import { parseHtmlSitemap, detectContentType } from './html-parser'

const MAX_CHILD_SITEMAPS    = 75   // max child sitemaps per index
const MAX_HTML_SUB_SITEMAPS = 20   // max sub-sitemap pages crawled from an HTML sitemap
const MAX_RECURSION_DEPTH   = 3
const FETCH_TIMEOUT_MS      = 15000

export interface FetchedSitemapResult {
  urls: string[]
  /** Maps each URL to the label of the sitemap it came from */
  urlSourceMap: Map<string, string>
  assetUrlsFiltered: number
  subSitemapsTotal: number
}

interface FetchResponse {
  body: string
  contentType: string
}

async function fetchWithTimeout(url: string): Promise<FetchResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ACE-Sitemap-Classifier/1.0 (AccessibilityChecker.org)',
        Accept: 'text/html,application/xml,text/xml,application/x-gzip,*/*',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`)
    }
    const contentType = response.headers.get('content-type') ?? ''
    const body = await response.text()
    return { body, contentType }
  } finally {
    clearTimeout(timer)
  }
}

function extractSitemapLabel(url: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || ''
    return last.replace(/\.(xml|txt|gz|php)$/i, '') || segments[segments.length - 2] || 'sitemap'
  } catch {
    return 'sitemap'
  }
}

/**
 * Derive a human-readable section label from a sub-sitemap URL.
 * e.g. /sitemap/brands/ → "brands" | sitemap_products_1.xml → "sitemap_products_1"
 */
function labelFromSubSitemapUrl(url: string): string {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    // If path is like /sitemap/brands/, return "brands"
    if (segments.length >= 2 && segments[0].toLowerCase() === 'sitemap') {
      return segments[1].replace(/\.(xml|php|html?)$/i, '')
    }
    // Filename-based label
    const last = segments[segments.length - 1] || ''
    return last.replace(/\.(xml|php|html?|txt|gz)$/i, '') || 'sitemap'
  } catch {
    return 'sitemap'
  }
}

// ── Recursive XML sitemap fetcher ────────────────────────────────────────────

async function fetchXmlSitemapRecursive(
  sitemapUrl: string,
  label: string,
  depth: number,
  visitedSitemaps: Set<string>,
  urlSourceMap: Map<string, string>,
  onProgress: (step: string, detail: string, percent: number) => void,
  progressBase: number,
  progressRange: number
): Promise<{ urls: string[]; assetsFiltered: number; childCount: number }> {
  if (depth > MAX_RECURSION_DEPTH) return { urls: [], assetsFiltered: 0, childCount: 0 }

  const normKey = sitemapUrl.toLowerCase().split('?')[0]
  if (visitedSitemaps.has(normKey)) return { urls: [], assetsFiltered: 0, childCount: 0 }
  visitedSitemaps.add(normKey)

  let resp: FetchResponse
  try {
    resp = await fetchWithTimeout(sitemapUrl)
  } catch (err) {
    console.warn(`Failed to fetch ${sitemapUrl}:`, err)
    return { urls: [], assetsFiltered: 0, childCount: 0 }
  }

  const parsed = parseSitemapXml(resp.body)

  if (parsed.type === 'sitemapindex') {
    const childUrls = parsed.sitemapUrls.slice(0, MAX_CHILD_SITEMAPS)
    const allUrls: string[] = []
    let totalAssets = 0

    for (let i = 0; i < childUrls.length; i++) {
      const childUrl = childUrls[i]
      const childLabel = extractSitemapLabel(childUrl)
      const pct = progressBase + Math.floor((i / childUrls.length) * progressRange)
      onProgress('Fetching sub-sitemaps', `[${i + 1}/${childUrls.length}] ${childLabel}`, pct)

      const childResult = await fetchXmlSitemapRecursive(
        childUrl, childLabel, depth + 1, visitedSitemaps, urlSourceMap,
        onProgress, pct, Math.floor(progressRange / childUrls.length)
      )
      for (const u of childResult.urls) {
        if (!urlSourceMap.has(u)) urlSourceMap.set(u, childLabel)
      }
      allUrls.push(...childResult.urls)
      totalAssets += childResult.assetsFiltered
    }
    return { urls: allUrls, assetsFiltered: totalAssets, childCount: childUrls.length }
  }

  // Regular urlset
  for (const u of parsed.urls) {
    if (!urlSourceMap.has(u)) urlSourceMap.set(u, label)
  }
  return { urls: parsed.urls, assetsFiltered: parsed.assetUrlsFiltered, childCount: 0 }
}

// ── HTML sitemap crawler ──────────────────────────────────────────────────────

async function crawlHtmlSitemap(
  startUrl: string,
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<{ urls: string[]; urlSourceMap: Map<string, string> }> {
  const urlSourceMap = new Map<string, string>()
  const seenSitemapPages = new Set<string>()
  const allPageLinks: Array<{ url: string; sectionLabel: string }> = []

  // Queue of HTML sitemap pages to fetch
  const queue: Array<{ url: string; label: string }> = [
    { url: startUrl, label: labelFromSubSitemapUrl(startUrl) }
  ]
  seenSitemapPages.add(startUrl.toLowerCase().split('?')[0])

  let processed = 0

  while (queue.length > 0 && processed < MAX_HTML_SUB_SITEMAPS) {
    const { url, label } = queue.shift()!
    processed++

    onProgress(
      'Crawling HTML sitemap',
      `Fetching section: ${label} (${processed}/${Math.min(queue.length + processed, MAX_HTML_SUB_SITEMAPS)})`,
      15 + Math.min(processed * 4, 60)
    )

    let resp: FetchResponse
    try {
      resp = await fetchWithTimeout(url)
    } catch (err) {
      console.warn(`Failed to fetch HTML sitemap page ${url}:`, err)
      continue
    }

    const { pageLinks, subSitemapLinks } = parseHtmlSitemap(resp.body, url)

    // Collect page links
    for (const { url: pageUrl, sectionLabel } of pageLinks) {
      allPageLinks.push({ url: pageUrl, sectionLabel: sectionLabel !== 'sitemap' ? sectionLabel : label })
    }

    // Enqueue discovered sub-sitemap pages
    for (const subUrl of subSitemapLinks) {
      const normKey = subUrl.toLowerCase().split('?')[0]
      if (!seenSitemapPages.has(normKey) && queue.length + processed < MAX_HTML_SUB_SITEMAPS) {
        seenSitemapPages.add(normKey)
        const subLabel = labelFromSubSitemapUrl(subUrl)
        queue.push({ url: subUrl, label: subLabel })
      }
    }
  }

  // Build the source map (first label wins for duplicates)
  for (const { url: pageUrl, sectionLabel } of allPageLinks) {
    if (!urlSourceMap.has(pageUrl)) {
      urlSourceMap.set(pageUrl, sectionLabel.toLowerCase())
    }
  }

  const urls = allPageLinks.map((l) => l.url)
  return { urls, urlSourceMap }
}

// ── Main exported function ────────────────────────────────────────────────────

export async function fetchSitemapUrls(
  sitemapUrl: string,
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<FetchedSitemapResult> {
  onProgress('Fetching sitemap', `Downloading ${sitemapUrl}`, 5)

  let resp: FetchResponse
  try {
    resp = await fetchWithTimeout(sitemapUrl)
  } catch (err) {
    throw new Error(
      `Failed to fetch sitemap: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  onProgress('Parsing sitemap', 'Detecting sitemap format', 12)

  const format = detectContentType(resp.body, resp.contentType)

  // ── HTML sitemap path ─────────────────────────────────────────────────────
  if (format === 'html') {
    onProgress('HTML sitemap detected', 'Parsing sections and links', 15)

    const { urls: rawUrls, urlSourceMap } = await crawlHtmlSitemap(sitemapUrl, onProgress)

    onProgress('Deduplicating URLs', `Processing ${rawUrls.length} links`, 82)
    const deduplicated = deduplicateUrls(rawUrls)

    // Rebuild source map for deduplicated URLs
    const deduplicatedSourceMap = new Map<string, string>()
    for (const url of deduplicated) {
      const label = urlSourceMap.get(url)
      if (label) deduplicatedSourceMap.set(url, label)
    }

    onProgress('Complete', `Found ${deduplicated.length} pages from HTML sitemap`, 95)
    return {
      urls: deduplicated,
      urlSourceMap: deduplicatedSourceMap,
      assetUrlsFiltered: 0,
      subSitemapsTotal: 0,
    }
  }

  // ── XML sitemap path ──────────────────────────────────────────────────────
  onProgress('XML sitemap detected', 'Analysing structure', 15)
  const parsed = parseSitemapXml(resp.body)
  const urlSourceMap = new Map<string, string>()
  const visitedSitemaps = new Set<string>()
  visitedSitemaps.add(sitemapUrl.toLowerCase().split('?')[0])

  let allUrls: string[] = []
  let totalAssetsFiltered = 0
  let subSitemapsTotal = 0

  if (parsed.type === 'sitemapindex') {
    const childUrls = parsed.sitemapUrls.slice(0, MAX_CHILD_SITEMAPS)
    subSitemapsTotal = childUrls.length

    onProgress('Sitemap index detected', `Found ${subSitemapsTotal} child sitemaps`, 20)

    for (let i = 0; i < childUrls.length; i++) {
      const childUrl = childUrls[i]
      const childLabel = extractSitemapLabel(childUrl)
      const pct = 20 + Math.floor((i / subSitemapsTotal) * 65)

      onProgress('Fetching sub-sitemaps', `[${i + 1}/${subSitemapsTotal}] ${childLabel}`, pct)

      const childResult = await fetchXmlSitemapRecursive(
        childUrl, childLabel, 1, visitedSitemaps, urlSourceMap,
        onProgress, pct, Math.floor(65 / subSitemapsTotal)
      )

      for (const u of childResult.urls) {
        if (!urlSourceMap.has(u)) urlSourceMap.set(u, childLabel)
      }
      allUrls.push(...childResult.urls)
      totalAssetsFiltered += childResult.assetsFiltered
    }
  } else {
    const rootLabel = extractSitemapLabel(sitemapUrl)
    for (const u of parsed.urls) urlSourceMap.set(u, rootLabel)
    allUrls = parsed.urls
    totalAssetsFiltered = parsed.assetUrlsFiltered
  }

  onProgress('Deduplicating URLs', `Processing ${allUrls.length} raw URLs`, 87)
  const deduplicated = deduplicateUrls(allUrls)

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
