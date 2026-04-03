/**
 * HTML Sitemap Parser
 *
 * Parses HTML-based sitemaps (sitemap.php, /sitemap/brands/, etc.) and extracts:
 * - All internal page links
 * - The section heading each link lives under (used as source label in classification)
 * - Sub-sitemap links that should be fetched recursively
 *
 * Handles structures like:
 *   <ul><li><strong>Brands</strong><ul><li><a href="/brands/foo">Foo</a></li></ul></li></ul>
 *   <h2>Categories</h2><ul><li><a href="/cat/dog">Dog</a></li></ul>
 */

import { parse as parseHtml, HTMLElement } from 'node-html-parser'

export interface HtmlSitemapResult {
  /** Actual page URLs found, tagged with their section label */
  pageLinks: Array<{ url: string; sectionLabel: string }>
  /** Sub-sitemap URLs found (e.g. /sitemap/brands/, /sitemap/categories/) */
  subSitemapLinks: string[]
}

/** Pattern that identifies a link as pointing to a sub-sitemap page rather than a real page */
const SUB_SITEMAP_PATH_PATTERN = /\/sitemap[/\-_](brands?|categor|products?|pages?|collections?|blogs?|news)[/\-_]?/i
const SHOW_ALL_TEXT_PATTERN = /^(show|view|see)\s+all/i

/**
 * Returns true if the URL looks like a sub-sitemap page rather than an actual content page.
 */
function isSubSitemapLink(href: string, linkText: string): boolean {
  if (SHOW_ALL_TEXT_PATTERN.test(linkText.trim())) return true
  if (SUB_SITEMAP_PATH_PATTERN.test(href)) return true
  return false
}

/**
 * Returns true if a URL looks like a real page we should classify
 * (not a navigation anchor, external link, asset, or obvious sitemap sub-page).
 */
function isPageLink(href: string, baseDomain: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false
  }
  // Resolve relative URLs
  let absolute: string
  try {
    absolute = new URL(href, `https://${baseDomain}`).toString()
  } catch {
    return false
  }
  // Must be same domain
  try {
    const parsed = new URL(absolute)
    if (!parsed.hostname.includes(baseDomain) && !baseDomain.includes(parsed.hostname)) {
      return false
    }
  } catch {
    return false
  }
  // Skip assets
  if (/\.(jpg|jpeg|png|gif|svg|webp|css|js|woff|woff2|ttf|pdf|zip)(\?.*)?$/i.test(href)) {
    return false
  }
  return true
}

function resolveHref(href: string, baseDomain: string): string {
  try {
    const u = new URL(href, `https://${baseDomain}`)
    u.hash = ''
    return u.toString()
  } catch {
    return href
  }
}

/**
 * Extract the best "section label" for a given <a> element by walking up
 * the DOM tree looking for the nearest heading or bold label.
 */
function findSectionLabel(el: HTMLElement, knownSections: Map<HTMLElement, string>): string {
  let cursor: HTMLElement | null = el.parentNode as HTMLElement | null
  while (cursor) {
    if (knownSections.has(cursor)) {
      return knownSections.get(cursor)!
    }
    cursor = cursor.parentNode as HTMLElement | null
  }
  return 'sitemap'
}

/**
 * Parse an HTML sitemap page and extract page links grouped by section.
 */
export function parseHtmlSitemap(html: string, pageUrl: string): HtmlSitemapResult {
  let baseDomain: string
  try {
    baseDomain = new URL(pageUrl).hostname
  } catch {
    baseDomain = pageUrl
  }

  const root = parseHtml(html, {
    lowerCaseTagName: true,
    comment: false,
    fixNestedATags: true,
    parseNoneClosedTags: true,
  })

  // ── Step 1: Find all section headings and map their DOM element → label ──
  // We support several common HTML sitemap structures:
  //   1. <h2>Brands</h2> followed by a <ul>
  //   2. <li><strong>Brands</strong><ul>...</ul></li>
  //   3. <li class="heading">Brands</li>

  const sectionContainers = new Map<HTMLElement, string>()

  // h1/h2/h3/h4 headings — their parent or next sibling contains links
  const headings = root.querySelectorAll('h1, h2, h3, h4')
  for (const heading of headings) {
    const label = heading.text.trim()
    if (!label || label.toLowerCase() === 'sitemap') continue
    // Associate the heading's parent element as the section container
    const parent = heading.parentNode as HTMLElement | null
    if (parent) sectionContainers.set(parent, label)
    // Also associate the heading itself so direct children get labeled
    sectionContainers.set(heading, label)
  }

  // <li> elements whose direct child is a <strong> or <b> (common in PHP sitemaps)
  const listItems = root.querySelectorAll('li')
  for (const li of listItems) {
    const firstChild = li.childNodes.find(
      (n) => n.nodeType === 1 // element node
    ) as HTMLElement | undefined

    if (
      firstChild &&
      (firstChild.tagName === 'strong' || firstChild.tagName === 'b') &&
      !firstChild.querySelector('a') // heading label, not a link
    ) {
      const label = firstChild.text.trim()
      if (label) sectionContainers.set(li, label)
    }
  }

  // ── Step 2: Collect all <a> tags and group them ──────────────────────────
  const pageLinks: Array<{ url: string; sectionLabel: string }> = []
  const subSitemapLinks: string[] = []
  const seenUrls = new Set<string>()

  const anchors = root.querySelectorAll('a[href]')
  for (const a of anchors) {
    const href = a.getAttribute('href') ?? ''
    const linkText = a.text.trim()

    if (!isPageLink(href, baseDomain)) continue

    const resolved = resolveHref(href, baseDomain)
    if (seenUrls.has(resolved)) continue
    seenUrls.add(resolved)

    const sectionLabel = findSectionLabel(a, sectionContainers)

    if (isSubSitemapLink(href, linkText)) {
      subSitemapLinks.push(resolved)
    } else {
      pageLinks.push({ url: resolved, sectionLabel })
    }
  }

  return { pageLinks, subSitemapLinks }
}

/**
 * Detect whether a response body is HTML or XML.
 * Returns 'html', 'xml', or 'unknown'.
 */
export function detectContentType(body: string, contentTypeHeader?: string): 'html' | 'xml' {
  if (contentTypeHeader) {
    if (/text\/html/i.test(contentTypeHeader)) return 'html'
    if (/xml/i.test(contentTypeHeader)) return 'xml'
  }
  const trimmed = body.trimStart().toLowerCase()
  if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) return 'html'
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<urlset') || trimmed.startsWith('<sitemapindex')) return 'xml'
  // Heuristic: if we see <loc> tags it's almost certainly XML
  if (/<loc>/i.test(body)) return 'xml'
  // If we see <a href= it's almost certainly HTML
  if (/<a\s+href=/i.test(body)) return 'html'
  return 'xml' // default to XML attempt
}
