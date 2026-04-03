import { XMLParser } from 'fast-xml-parser'

const ASSET_EXTENSIONS =
  /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff|mp4|mp3|avi|mov|wmv|flv|ogg|wav|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz|rar|css|js|json|xml|txt|csv)(\?.*)?$/i

const ASSET_PATHS =
  /\/(wp-content\/uploads|static\/media|_next\/static|assets\/(images|fonts|media|videos))\//i

// API-like paths that are definitely not pages
const API_PATHS = /\/(api|graphql|rest|v\d+|ajax|xhr)\//i

export function isAssetUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname
    return ASSET_EXTENSIONS.test(path) || ASSET_PATHS.test(path) || API_PATHS.test(path)
  } catch {
    return ASSET_EXTENSIONS.test(url) || ASSET_PATHS.test(url)
  }
}

export interface ParseResult {
  type: 'sitemapindex' | 'urlset' | 'unknown'
  urls: string[]
  sitemapUrls: string[]
  assetUrlsFiltered: number
}

/**
 * Unwrap CDATA sections from a string value.
 * fast-xml-parser handles most CDATA but sometimes returns raw strings.
 */
function unwrapCdata(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1').trim()
}

/**
 * Safely extract a <loc> string from a parsed XML element.
 */
function extractLoc(element: unknown): string | null {
  if (!element || typeof element !== 'object') return null
  const obj = element as Record<string, unknown>
  const loc = obj['loc']
  if (typeof loc === 'string') return unwrapCdata(loc)
  // fast-xml-parser may nest CDATA as { '#text': '...' }
  if (loc && typeof loc === 'object') {
    const nested = loc as Record<string, unknown>
    if (typeof nested['#text'] === 'string') return unwrapCdata(nested['#text'])
  }
  return null
}

export function parseSitemapXml(xmlContent: string): ParseResult {
  // Pre-process: strip XML declarations and common namespace issues
  const cleaned = xmlContent
    .replace(/<\?xml[^>]*\?>/g, '')
    .trim()

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    trimValues: true,
    allowBooleanAttributes: true,
    cdataPropName: '#cdata',
    processEntities: true,
  })

  let parsed: Record<string, unknown>
  try {
    parsed = parser.parse(cleaned)
  } catch {
    return fallbackRegexParse(xmlContent)
  }

  // Check for sitemapindex (may appear under various namespace-stripped keys)
  const sitemapIndexKey = Object.keys(parsed).find(
    (k) => k === 'sitemapindex' || k.endsWith(':sitemapindex') || k === 'SitemapIndex'
  )
  if (sitemapIndexKey) {
    const sitemapindex = parsed[sitemapIndexKey] as Record<string, unknown>
    const sitemaps = sitemapindex['sitemap'] ?? sitemapindex['Sitemap']
    const sitemapArr = Array.isArray(sitemaps) ? sitemaps : sitemaps ? [sitemaps] : []
    const sitemapUrls: string[] = []
    for (const s of sitemapArr) {
      const loc = extractLoc(s)
      if (loc && loc.startsWith('http')) sitemapUrls.push(loc)
    }
    return { type: 'sitemapindex', urls: [], sitemapUrls, assetUrlsFiltered: 0 }
  }

  // Check for urlset (may appear under namespace-stripped keys)
  const urlsetKey = Object.keys(parsed).find(
    (k) => k === 'urlset' || k.endsWith(':urlset') || k === 'UrlSet'
  )
  if (urlsetKey) {
    const urlset = parsed[urlsetKey] as Record<string, unknown>
    const urlsRaw = urlset['url'] ?? urlset['Url']
    const urlArr = Array.isArray(urlsRaw) ? urlsRaw : urlsRaw ? [urlsRaw] : []
    let assetCount = 0
    const filteredUrls: string[] = []
    for (const u of urlArr) {
      const loc = extractLoc(u)
      if (loc && loc.startsWith('http')) {
        if (isAssetUrl(loc)) {
          assetCount++
        } else {
          filteredUrls.push(loc)
        }
      }
    }
    return { type: 'urlset', urls: filteredUrls, sitemapUrls: [], assetUrlsFiltered: assetCount }
  }

  // Unknown structure — regex fallback
  return fallbackRegexParse(xmlContent)
}

/**
 * Regex-based fallback when XML parsing fails or structure is unrecognised.
 * Detects sitemapindex vs urlset based on tag presence.
 */
function fallbackRegexParse(xmlContent: string): ParseResult {
  // Check if it looks like a sitemap index
  const hasSitemapTags = /<sitemap[^i]/i.test(xmlContent)
  const hasSitemapIndexTag = /<sitemapindex/i.test(xmlContent)

  const locMatches = xmlContent.match(/<loc>([\s\S]*?)<\/loc>/gi) || []
  const extractedUrls = locMatches
    .map((m) => m.replace(/<\/?loc>/gi, '').replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1').trim())
    .filter((u) => u.startsWith('http'))

  if (hasSitemapIndexTag || hasSitemapTags) {
    // Treat extracted URLs as child sitemap links
    return {
      type: 'sitemapindex',
      urls: [],
      sitemapUrls: extractedUrls,
      assetUrlsFiltered: 0,
    }
  }

  let assetCount = 0
  const filteredUrls = extractedUrls.filter((u) => {
    if (isAssetUrl(u)) {
      assetCount++
      return false
    }
    return true
  })

  return {
    type: 'unknown',
    urls: filteredUrls,
    sitemapUrls: [],
    assetUrlsFiltered: assetCount,
  }
}

export function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const url of urls) {
    // Normalise: lowercase, strip trailing slash, strip common tracking params
    let normalised: string
    try {
      const u = new URL(url)
      // Remove fragment
      u.hash = ''
      // Remove purely tracking params
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_ga']
      for (const p of trackingParams) u.searchParams.delete(p)
      normalised = u.toString().replace(/\/$/, '').toLowerCase()
    } catch {
      normalised = url.replace(/\/$/, '').toLowerCase()
    }
    if (!seen.has(normalised)) {
      seen.add(normalised)
      result.push(url)
    }
  }
  return result
}

export function parseUrlList(text: string): string[] {
  const lines = text
    .split(/[\n,\r]+/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('http'))

  let assetCount = 0
  const filtered = lines.filter((u) => {
    if (isAssetUrl(u)) {
      assetCount++
      return false
    }
    return true
  })

  void assetCount
  return deduplicateUrls(filtered)
}
