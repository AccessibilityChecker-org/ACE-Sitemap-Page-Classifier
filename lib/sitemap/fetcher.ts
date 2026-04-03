import { parseSitemapXml, deduplicateUrls } from './parser'

const MAX_SITEMAPS = 50
const FETCH_TIMEOUT_MS = 15000

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ACE-Sitemap-Classifier/1.0 (AccessibilityChecker.org)',
        Accept: 'application/xml,text/xml,*/*',
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

export async function fetchSitemapUrls(
  sitemapUrl: string,
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<{ urls: string[]; assetUrlsFiltered: number; subSitemapsTotal: number }> {
  onProgress('Fetching sitemap', `Downloading ${sitemapUrl}`, 5)

  let xmlContent: string
  try {
    xmlContent = await fetchWithTimeout(sitemapUrl)
  } catch (err) {
    throw new Error(`Failed to fetch sitemap: ${err instanceof Error ? err.message : String(err)}`)
  }

  onProgress('Parsing sitemap', 'Analyzing sitemap structure', 15)
  const parsed = parseSitemapXml(xmlContent)

  if (parsed.type === 'sitemapindex') {
    // Sitemap index - fetch all child sitemaps
    const childUrls = parsed.sitemapUrls.slice(0, MAX_SITEMAPS)
    const totalChildren = childUrls.length
    onProgress('Sitemap index detected', `Found ${totalChildren} sub-sitemaps`, 20)

    const allUrls: string[] = []
    let totalAssetsFiltered = 0

    for (let i = 0; i < childUrls.length; i++) {
      const childUrl = childUrls[i]
      const progressPercent = 20 + Math.floor((i / totalChildren) * 60)
      onProgress(
        'Fetching sub-sitemaps',
        `Fetching sub-sitemap ${i + 1}/${totalChildren}: ${new URL(childUrl).pathname}`,
        progressPercent
      )

      try {
        const childXml = await fetchWithTimeout(childUrl)
        const childParsed = parseSitemapXml(childXml)
        allUrls.push(...childParsed.urls)
        totalAssetsFiltered += childParsed.assetUrlsFiltered
      } catch (err) {
        console.warn(`Failed to fetch child sitemap ${childUrl}:`, err)
      }
    }

    onProgress('Deduplicating URLs', `Processing ${allUrls.length} raw URLs`, 85)
    const deduplicated = deduplicateUrls(allUrls)

    onProgress('Complete', `Found ${deduplicated.length} unique pages`, 95)
    return {
      urls: deduplicated,
      assetUrlsFiltered: totalAssetsFiltered,
      subSitemapsTotal: totalChildren,
    }
  }

  // Regular urlset
  onProgress('Processing URLs', `Found ${parsed.urls.length} URLs`, 85)
  const deduplicated = deduplicateUrls(parsed.urls)

  onProgress('Complete', `Found ${deduplicated.length} unique pages`, 95)
  return {
    urls: deduplicated,
    assetUrlsFiltered: parsed.assetUrlsFiltered,
    subSitemapsTotal: 0,
  }
}
