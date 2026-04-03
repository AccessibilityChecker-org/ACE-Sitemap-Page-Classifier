/**
 * URL-pattern based clustering algorithm.
 *
 * Groups URLs by their structural path pattern, replacing variable segments
 * (IDs, slugs, hashes, dates) with a {var} placeholder.
 *
 * Principle: two URLs that differ only in variable segments share the same
 * template layout and should be grouped together.
 */

/**
 * Returns true if a path segment looks like a variable (ID, slug, hash, date)
 * rather than a fixed route keyword.
 */
function isVariableSegment(segment: string): boolean {
  // Pure numeric ID  (e.g. 12345)
  if (/^\d+$/.test(segment)) return true

  // UUID  (e.g. 550e8400-e29b-41d4-a716-446655440000)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment))
    return true

  // Hex hash / CMS token  (e.g. a1b2c3d4e5f6)
  if (/^[0-9a-f]{12,}$/i.test(segment)) return true

  // Long alphanumeric token (20+ chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(segment)) return true

  // Hyphenated slug with at least one hyphen — this is the most important rule.
  // Slugs like "red-running-shoes", "john-doe", "my-brand-name" are all variable.
  // We require length > 3 to avoid treating short fixed keywords like "new" as variable.
  if (segment.includes('-') && segment.length > 3) return true

  // Underscore-separated slug (e.g. some_product_name)
  if (segment.includes('_') && segment.length > 8) return true

  // Date-looking segments  (e.g. 2024-01-15, 20240115, 2024)
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(segment)) return true
  if (/^\d{8}$/.test(segment)) return true

  // Looks like a WordPress post slug or Shopify handle (lowercase, may include numbers)
  // e.g. "my-awesome-product-123"
  if (/^[a-z][a-z0-9-]{5,}$/.test(segment)) return true

  return false
}

/**
 * Fixed structural keywords that should NEVER be treated as variable,
 * even if they match slug-like patterns above.
 * These are common route prefixes in ecommerce/CMS platforms.
 */
const FIXED_KEYWORDS = new Set([
  'products', 'product', 'collections', 'collection',
  'categories', 'category', 'cat',
  'brands', 'brand', 'manufacturer',
  'blogs', 'blog', 'news', 'articles', 'article', 'posts', 'post',
  'pages', 'page',
  'shop', 'store',
  'account', 'accounts', 'profile',
  'checkout', 'cart', 'basket',
  'search',
  'help', 'support', 'docs', 'faq',
  'about', 'contact', 'team', 'careers',
  'legal', 'privacy', 'terms',
  'plants', 'plant', 'species', 'glossary', 'directory',
  'landing', 'lp', 'promo', 'campaign',
  'login', 'register', 'signup', 'logout',
  'wishlist', 'compare',
  'en', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'ja', 'zh',  // language codes
  'us', 'uk', 'ca', 'au',                                   // country codes
  'www', 'm', 'app',
])

function isStrictlyVariable(segment: string, idx: number): boolean {
  // The first path segment (idx === 0) is almost always a route prefix keyword
  // and should never be treated as variable.
  if (idx === 0) return false

  // Known fixed keywords should never be variable
  if (FIXED_KEYWORDS.has(segment.toLowerCase())) return false

  return isVariableSegment(segment)
}

/**
 * Compute a stable pattern signature for a URL.
 * Variable segments are replaced with {var}.
 *
 * Examples:
 *   /products/red-running-shoes → domain.com/products/{var}
 *   /collections/summer-sale    → domain.com/collections/{var}
 *   /blogs/news/post-title      → domain.com/blogs/news/{var}
 *   /2024/01/15/my-post         → domain.com/{var}/{var}/{var}/{var}
 *   /about                      → domain.com/about
 */
export function computePathPattern(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)

    if (segments.length === 0) return parsed.hostname + '/'

    const rawPatternSegments: string[] = segments.map((seg, idx): string => {
      return isStrictlyVariable(seg, idx) ? '{var}' : seg.toLowerCase()
    })

    // If the entire path became {var} placeholders (extremely rare edge case),
    // fall back to pinning the first segment to avoid over-clustering.
    const allVar = rawPatternSegments.length > 1 && rawPatternSegments.every((s) => s === '{var}')
    const patternSegments = allVar
      ? [segments[0].toLowerCase(), ...rawPatternSegments.slice(1)]
      : rawPatternSegments

    return parsed.hostname + '/' + patternSegments.join('/')
  } catch {
    return url
  }
}

export function clusterByPattern(urls: string[]): Map<string, string[]> {
  const clusters = new Map<string, string[]>()

  for (const url of urls) {
    const pattern = computePathPattern(url)
    const existing = clusters.get(pattern) || []
    existing.push(url)
    clusters.set(pattern, existing)
  }

  return clusters
}

/**
 * Given clusters, return those with enough URLs to justify template+content treatment.
 */
export function getTemplateClusters(
  clusters: Map<string, string[]>,
  minGroupSize: number = 3
): Set<string> {
  const templatePatterns = new Set<string>()

  for (const [pattern, urls] of Array.from(clusters.entries())) {
    if (urls.length >= minGroupSize) {
      templatePatterns.add(pattern)
    }
  }

  return templatePatterns
}
