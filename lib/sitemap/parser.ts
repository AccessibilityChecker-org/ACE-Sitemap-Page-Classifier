import { XMLParser } from 'fast-xml-parser'

const ASSET_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|tiff|mp4|mp3|avi|mov|wmv|flv|ogg|wav|woff|woff2|ttf|eot|otf|pdf|zip|tar|gz|rar|css|js|json|xml|txt|csv)(\?.*)?$/i

const ASSET_PATHS = /\/(wp-content\/uploads|static\/media|_next\/static|assets\/(images|fonts|media|videos))\//i

export function isAssetUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return ASSET_EXTENSIONS.test(u.pathname) || ASSET_PATHS.test(u.pathname)
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

export function parseSitemapXml(xmlContent: string): ParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    trimValues: true,
    allowBooleanAttributes: true,
  })

  let parsed: Record<string, unknown>
  try {
    parsed = parser.parse(xmlContent)
  } catch {
    // Try a simple regex fallback
    const locMatches = xmlContent.match(/<loc>(.*?)<\/loc>/gi) || []
    const extractedUrls = locMatches
      .map((m) => m.replace(/<\/?loc>/gi, '').trim())
      .filter((u) => u.startsWith('http'))

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

  // Check for sitemapindex
  if (parsed.sitemapindex) {
    const sitemapindex = parsed.sitemapindex as Record<string, unknown>
    const sitemaps = sitemapindex.sitemap
    const sitemapArr = Array.isArray(sitemaps) ? sitemaps : sitemaps ? [sitemaps] : []
    const sitemapUrls: string[] = []
    for (const s of sitemapArr) {
      const loc = (s as Record<string, unknown>).loc
      if (loc && typeof loc === 'string') {
        sitemapUrls.push(loc.trim())
      }
    }
    return { type: 'sitemapindex', urls: [], sitemapUrls, assetUrlsFiltered: 0 }
  }

  // Check for urlset
  if (parsed.urlset) {
    const urlset = parsed.urlset as Record<string, unknown>
    const urlsRaw = urlset.url
    const urlArr = Array.isArray(urlsRaw) ? urlsRaw : urlsRaw ? [urlsRaw] : []
    let assetCount = 0
    const filteredUrls: string[] = []
    for (const u of urlArr) {
      const loc = (u as Record<string, unknown>).loc
      if (loc && typeof loc === 'string') {
        const urlStr = loc.trim()
        if (isAssetUrl(urlStr)) {
          assetCount++
        } else {
          filteredUrls.push(urlStr)
        }
      }
    }
    return { type: 'urlset', urls: filteredUrls, sitemapUrls: [], assetUrlsFiltered: assetCount }
  }

  // Unknown format - try to extract any <loc> tags
  const xmlStr = JSON.stringify(parsed)
  const locMatches = xmlContent.match(/<loc>(.*?)<\/loc>/gi) || []
  const extractedUrls = locMatches
    .map((m) => m.replace(/<\/?loc>/gi, '').trim())
    .filter((u) => u.startsWith('http'))

  let assetCount = 0
  const filteredUrls = extractedUrls.filter((u) => {
    if (isAssetUrl(u)) {
      assetCount++
      return false
    }
    return true
  })

  // Avoid unused variable warning
  void xmlStr

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
    const normalized = url.replace(/\/$/, '').toLowerCase()
    if (!seen.has(normalized)) {
      seen.add(normalized)
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

  return deduplicateUrls(filtered)
}
