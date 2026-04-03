import type { PageCategory } from '@/types'

export interface ClassificationRule {
  category: PageCategory
  patterns: RegExp[]
  priority: number
  notes: string
}

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  // ── Homepage ─────────────────────────────────────────────────────────────
  {
    category: 'Homepage',
    patterns: [/^https?:\/\/[^/]+(\/)?$/],
    priority: 100,
    notes: 'Root domain homepage',
  },

  // ── Blog Index ───────────────────────────────────────────────────────────
  {
    category: 'Blog Index',
    patterns: [
      /\/blog\/?$/i,
      /\/blogs\/?$/i,
      /\/news\/?$/i,
      /\/articles\/?$/i,
      /\/posts\/?$/i,
      /\/journal\/?$/i,
      /\/insights\/?$/i,
    ],
    priority: 90,
    notes: 'Blog/news index page (exact)',
  },

  // ── Product Pages ─────────────────────────────────────────────────────────
  {
    category: 'Product Pages',
    patterns: [
      /\/products\/.+/i,
      /\/product\/.+/i,
      /\/shop\/.+/i,
      /\/item\/.+/i,
      /\/p\/.+/i,
      /\/catalog\/product\/.+/i,
      /[?&]product_id=/i,
      /\/dp\/[A-Z0-9]{10}/i, // Amazon-style
    ],
    priority: 80,
    notes: 'Individual product detail pages',
  },

  // ── Collection Pages ──────────────────────────────────────────────────────
  {
    category: 'Collection Pages',
    patterns: [
      /\/collections\/.+/i,
      /\/collection\/.+/i,
    ],
    priority: 79,
    notes: 'Shopify collection pages',
  },

  // ── Category Pages ────────────────────────────────────────────────────────
  {
    category: 'Category Pages',
    patterns: [
      /\/categor(y|ies)\/.+/i,
      /\/cat\/.+/i,
      /\/department\/.+/i,
      /\/c\/.+/i,
      /\/taxonomy\/.+/i,
    ],
    priority: 78,
    notes: 'Product or content category pages',
  },

  // ── Blog Posts ────────────────────────────────────────────────────────────
  {
    category: 'Blog Posts',
    patterns: [
      /\/blogs\/.+\/.+/i,
      /\/blog\/.+/i,
      /\/news\/.+/i,
      /\/articles?\/.+/i,
      /\/posts?\/.+/i,
      /\/journal\/.+/i,
      /\/insights?\/.+/i,
      /\/\d{4}\/\d{2}\/\d{2}\/.+/i, // WordPress date-based
      /\/\d{4}\/\d{2}\/.+/i,
    ],
    priority: 70,
    notes: 'Individual blog post or article pages',
  },

  // ── Search Pages ──────────────────────────────────────────────────────────
  {
    category: 'Search Pages',
    patterns: [
      /\/search(\?.*)?$/i,
      /\/search\/.*/i,
      /[?&]q=/i,
      /[?&]query=/i,
      /[?&]s=/i,
    ],
    priority: 65,
    notes: 'Search results pages',
  },

  // ── Account Pages ─────────────────────────────────────────────────────────
  {
    category: 'Account Pages',
    patterns: [
      /\/account(\/.*)?$/i,
      /\/my-account(\/.*)?$/i,
      /\/profile(\/.*)?$/i,
      /\/dashboard(\/.*)?$/i,
      /\/login\/?$/i,
      /\/sign-?in\/?$/i,
      /\/sign-?up\/?$/i,
      /\/register\/?$/i,
      /\/logout\/?$/i,
      /\/forgot-password\/?$/i,
      /\/reset-password(\/.*)?$/i,
      /\/orders(\/.*)?$/i,
      /\/wishlist(\/.*)?$/i,
    ],
    priority: 60,
    notes: 'User account and authentication pages',
  },

  // ── Checkout / Cart Pages ─────────────────────────────────────────────────
  {
    category: 'Checkout / Cart Pages',
    patterns: [
      /\/cart\/?$/i,
      /\/checkout(\/.*)?$/i,
      /\/basket\/?$/i,
      /\/order-confirmation(\/.*)?$/i,
      /\/thank-you(\/.*)?$/i,
    ],
    priority: 55,
    notes: 'Shopping cart and checkout flow',
  },

  // ── Policy / Legal Pages ──────────────────────────────────────────────────
  {
    category: 'Policy / Legal Pages',
    patterns: [
      /\/privacy(-policy)?\/?$/i,
      /\/terms(-of-?(service|use))?\/?$/i,
      /\/legal(\/.*)?$/i,
      /\/disclaimer\/?$/i,
      /\/cookie(-policy)?\/?$/i,
      /\/gdpr\/?$/i,
      /\/accessibility(-statement)?\/?$/i,
      /\/return(-policy)?\/?$/i,
      /\/refund(-policy)?\/?$/i,
      /\/shipping(-policy)?\/?$/i,
    ],
    priority: 50,
    notes: 'Legal, policy, and compliance pages',
  },

  // ── Help Center / Docs Pages ──────────────────────────────────────────────
  {
    category: 'Help Center / Docs Pages',
    patterns: [
      /\/help(\/.*)?$/i,
      /\/support(\/.*)?$/i,
      /\/docs?\/(.*)?$/i,
      /\/documentation(\/.*)?$/i,
      /\/faq\/?$/i,
      /\/knowledge-?base(\/.*)?$/i,
      /\/guides?\/(.*)?$/i,
      /\/tutorials?\/(.*)?$/i,
      /\/how-to(\/.*)?$/i,
    ],
    priority: 45,
    notes: 'Help, documentation, and FAQ pages',
  },

  // ── Landing Pages ─────────────────────────────────────────────────────────
  {
    category: 'Landing Pages',
    patterns: [
      /\/lp\/.+/i,
      /\/landing\/.+/i,
      /\/promo\/.+/i,
      /\/campaign\/.+/i,
      /\/offers?\/.+/i,
      /\/go\/.+/i,
    ],
    priority: 40,
    notes: 'Marketing and campaign landing pages',
  },

  // ── Static Pages ──────────────────────────────────────────────────────────
  {
    category: 'Static Pages',
    patterns: [
      /\/pages?\/.+/i,
      /\/about(-us)?\/?$/i,
      /\/contact(-us)?\/?$/i,
      /\/team\/?$/i,
      /\/careers?\/?$/i,
      /\/jobs?\/?$/i,
      /\/press\/?$/i,
      /\/media\/?$/i,
      /\/partnership\/?$/i,
      /\/investors?\/?$/i,
      /\/sitemap\/?$/i,
      /\/404\/?$/i,
      /\/locations?\/?$/i,
      /\/store-?finder\/?$/i,
    ],
    priority: 30,
    notes: 'Static informational pages',
  },
]

export function findMatchingRule(url: string): ClassificationRule | null {
  let bestMatch: ClassificationRule | null = null
  let bestPriority = -1

  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(url)) {
        if (rule.priority > bestPriority) {
          bestPriority = rule.priority
          bestMatch = rule
        }
        break
      }
    }
  }

  return bestMatch
}
