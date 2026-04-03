/**
 * Sitemap auto-discovery.
 *
 * When a user enters a root domain URL (e.g. https://www.countrymax.com/),
 * we attempt to find the real sitemap URL before fetching it.
 *
 * Strategy (in order):
 *  1. If the URL already looks like a sitemap → skip discovery, use as-is
 *  2. Fetch /robots.txt and parse Sitemap: directives
 *  3. Probe common sitemap paths in order
 */

const COMMON_SITEMAP_PATHS = [
  '/sitemap_index.xml',
  '/sitemap-index.xml',
  '/sitemap.xml',
  '/sitemap.php',
  '/sitemap/',
  '/sitemap.html',
  '/sitemap.htm',
]

const SITEMAP_EXTENSIONS = /\.(xml|php|html?|txt|gz)(\.gz)?$/i
const SITEMAP_PATH_PATTERN = /\bsitemap\b/i

/** Returns true if the URL already looks like a direct sitemap path. */
function looksLikeSitemapUrl(url: string): boolean {
  try {
    const u = new URL(url)
    const path = u.pathname
    // Has a sitemap-like extension
    if (SITEMAP_EXTENSIONS.test(path)) return true
    // Path contains "sitemap" and is not just "/"
    if (path !== '/' && SITEMAP_PATH_PATTERN.test(path)) return true
    return false
  } catch {
    return false
  }
}

/** Extract Sitemap: lines from a robots.txt body */
function extractSitemapsFromRobots(robotsBody: string): string[] {
  const results: string[] = []
  for (const line of robotsBody.split('\n')) {
    const trimmed = line.trim()
    if (/^Sitemap:\s*/i.test(trimmed)) {
      const url = trimmed.replace(/^Sitemap:\s*/i, '').trim()
      if (url.startsWith('http')) results.push(url)
    }
  }
  return results
}

const FETCH_TIMEOUT_MS = 8000

async function probe(url: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'ACE-Sitemap-Classifier/1.0 (AccessibilityChecker.org)',
        Accept: 'text/html,application/xml,text/xml,*/*',
      },
    })
    clearTimeout(timer)
    if (!response.ok) return false
    // Quick content sniff — must look like XML or HTML with sitemap content
    const text = await response.text()
    return (
      text.includes('<urlset') ||
      text.includes('<sitemapindex') ||
      text.includes('<loc>') ||
      // HTML sitemap page
      (text.toLowerCase().includes('sitemap') && text.includes('<a '))
    )
  } catch {
    clearTimeout(timer)
    return false
  }
}

export interface DiscoveryResult {
  /** The discovered sitemap URL to use */
  url: string
  /** Human-readable description of how it was found */
  method: string
}

/**
 * Attempt to discover the sitemap URL for a given root domain URL.
 * Returns null if the input already looks like a sitemap.
 * Returns the first discovered sitemap URL, or null if none found.
 */
export async function discoverSitemapUrl(
  inputUrl: string
): Promise<DiscoveryResult | null> {
  // Normalise: add https:// if missing
  let normalized = inputUrl.trim()
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized
  }

  // If it already looks like a sitemap URL, skip discovery
  if (looksLikeSitemapUrl(normalized)) return null

  let origin: string
  try {
    origin = new URL(normalized).origin
  } catch {
    return null
  }

  // ── Step 1: robots.txt ──────────────────────────────────────────────────────
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const robotsRes = await fetch(`${origin}/robots.txt`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ACE-Sitemap-Classifier/1.0 (AccessibilityChecker.org)' },
    })
    clearTimeout(timer)

    if (robotsRes.ok) {
      const body = await robotsRes.text()
      const sitemapsFromRobots = extractSitemapsFromRobots(body)
      // Prefer sitemapindex > single sitemap in robots.txt
      const preferred = sitemapsFromRobots.find((u) =>
        u.includes('index') || u.includes('sitemap_index')
      ) ?? sitemapsFromRobots[0]

      if (preferred) {
        return { url: preferred, method: `robots.txt (Sitemap: ${preferred})` }
      }
    }
  } catch {
    // robots.txt unavailable — proceed to probing
  }

  // ── Step 2: probe common paths ──────────────────────────────────────────────
  for (const path of COMMON_SITEMAP_PATHS) {
    const candidate = origin + path
    if (await probe(candidate)) {
      return { url: candidate, method: `common path (${path})` }
    }
  }

  // Nothing found — return null so caller falls back to using inputUrl as-is
  return null
}
