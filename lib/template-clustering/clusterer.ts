/**
 * URL-pattern based clustering algorithm.
 * Groups URLs by their structural path pattern, replacing variable segments
 * with {var} placeholder.
 */

function isVariableSegment(segment: string): boolean {
  // Numeric IDs
  if (/^\d+$/.test(segment)) return true
  // UUIDs
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true
  // Slugs with multiple hyphens (likely product/post slugs)
  if (segment.includes('-') && segment.length > 10) return true
  // Long alphanumeric strings (likely IDs or hashes)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(segment)) return true
  return false
}

/**
 * Compute pattern signature for a URL path.
 * Variable segments (IDs, slugs) are replaced with {var}.
 */
function computePathPattern(url: string): string {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)

    // Replace last segment if it looks like a variable (slug/ID)
    // Keep first N-1 segments as-is; replace last if variable
    if (segments.length === 0) return parsed.hostname + '/'

    const patternSegments = segments.map((seg, idx) => {
      // Always keep the first segment (it's typically the route prefix like 'products', 'collections')
      if (idx === 0) return seg
      // For subsequent segments, check if they look like variables
      return isVariableSegment(seg) ? '{var}' : seg
    })

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
 * Given clusters, determine which are "template-worthy" (have enough URLs
 * to justify template + content classification).
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
