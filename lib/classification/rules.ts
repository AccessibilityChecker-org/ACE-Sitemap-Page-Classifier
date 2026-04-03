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
      /\/resources\/?$/i,
      /\/press\/?$/i,
      /\/updates\/?$/i,
    ],
    priority: 90,
    notes: 'Blog/news index page (exact root)',
  },

  // ── Search Pages ──────────────────────────────────────────────────────────
  // High priority: search overrides almost everything because it implies
  // interactive testing regardless of URL structure
  {
    category: 'Search Pages',
    patterns: [
      /\/search(\?.*)?$/i,
      /\/search\/.*/i,
      /\/search\.php(\?.*)?$/i,
      /[?&]q=[^&]/i,
      /[?&]query=[^&]/i,
      /[?&]s=[^&]/i,
      /[?&]search=[^&]/i,
      /[?&]keyword=[^&]/i,
      /[?&]term=[^&]/i,
    ],
    priority: 85,
    notes: 'Search results — interactive filtering required',
  },

  // ── Product Pages ─────────────────────────────────────────────────────────
  {
    category: 'Product Pages',
    patterns: [
      /\/products?\/.+/i,
      /\/shop\/.+/i,
      /\/item\/.+/i,
      /\/p\/.+/i,
      /\/catalog\/product\/.+/i,
      /\/catalogue\/product\/.+/i,
      /[?&]product_id=\d/i,
      /\/dp\/[A-Z0-9]{10}/i,        // Amazon-style ASIN
      /\/product\.php[?].*/i,        // PHP product pages
      /\/index\.php.*product/i,
      /\/goods\/.+/i,
      /\/skus?\/.+/i,
    ],
    priority: 80,
    notes: 'Individual product detail pages',
  },

  // ── Collection Pages ──────────────────────────────────────────────────────
  {
    category: 'Collection Pages',
    patterns: [
      /\/collections?\/.+/i,
    ],
    priority: 79,
    notes: 'Shopify collection pages (repeated layout family)',
  },

  // ── Brand Pages ───────────────────────────────────────────────────────────
  {
    category: 'Brand Pages',
    patterns: [
      /\/brands?\/.+/i,
      /\/manufacturer\/.+/i,
      /\/vendor\/.+/i,
      /\/label\/.+/i,
      /\/designer\/.+/i,
      /\/maker\/.+/i,
    ],
    priority: 78,
    notes: 'Brand/manufacturer detail pages (repeated layout, different brand data)',
  },

  // ── Category Pages ────────────────────────────────────────────────────────
  {
    category: 'Category Pages',
    patterns: [
      /\/categor(?:y|ies)\/.+/i,
      /\/cat\/.+/i,
      /\/department\/.+/i,
      /\/departments?\/.+/i,
      /\/c\/.+/i,
      /\/taxonomy\/.+/i,
      /\/range\/.+/i,
      /\/section\/.+/i,
      /\/type\/.+/i,
      /\/t\/.+/i,           // common short category path
    ],
    priority: 77,
    notes: 'Product or content category pages (repeated layout family)',
  },

  // ── Plant / Database Pages ────────────────────────────────────────────────
  {
    category: 'Plant / Database Pages',
    patterns: [
      /\/plants?\/.+/i,
      /\/species\/.+/i,
      /\/cultivar\/.+/i,
      /\/variety\/.+/i,
      /\/varieties\/.+/i,
      /\/flora\/.+/i,
      /\/herb\/.+/i,
      /\/tree\/.+/i,
      /\/shrub\/.+/i,
      /\/flower\/.+/i,
      /\/database\/.+/i,
      /\/entries?\/.+/i,
      /\/records?\/.+/i,
      /\/specimens?\/.+/i,
      /\/glossar(?:y|ies)\/.+/i,
      /\/directory\/.+/i,
      /\/profiles?\/.+/i,
      /\/encycloped\w+\/.+/i,
    ],
    priority: 76,
    notes: 'Database-style detail pages (repeated layout, different data entry)',
  },

  // ── Blog Posts ────────────────────────────────────────────────────────────
  {
    category: 'Blog Posts',
    patterns: [
      /\/blogs\/.+\/.+/i,        // Shopify: /blogs/{feed}/{slug}
      /\/blog\/.+/i,
      /\/news\/.+/i,
      /\/articles?\/.+/i,
      /\/posts?\/.+/i,
      /\/journal\/.+/i,
      /\/insights?\/.+/i,
      /\/resources?\/.+/i,
      /\/updates?\/.+/i,
      /\/\d{4}\/\d{2}\/\d{2}\/.+/i,  // WordPress date-based
      /\/\d{4}\/\d{2}\/.+/i,
      /\/press\/.+/i,
      /\/stories?\/.+/i,
      /\/events?\/.+/i,
    ],
    priority: 70,
    notes: 'Individual blog post or article pages (repeated layout family)',
  },

  // ── Account Pages ─────────────────────────────────────────────────────────
  {
    category: 'Account Pages',
    patterns: [
      /\/account(\/.*)?$/i,
      /\/my-account(\/.*)?$/i,
      /\/my_account(\/.*)?$/i,
      /\/profile(\/.*)?$/i,
      /\/dashboard(\/.*)?$/i,
      /\/login\/?(\?.*)?$/i,
      /\/login\.php(\?.*)?$/i,
      /\/sign-?in\/?(\?.*)?$/i,
      /\/sign-?up\/?(\?.*)?$/i,
      /\/register\/?(\?.*)?$/i,
      /\/registration\/?(\?.*)?$/i,
      /\/logout\/?(\?.*)?$/i,
      /\/forgot-?password\/?(\?.*)?$/i,
      /\/reset-?password(\/.*)?$/i,
      /\/orders?(\/.*)?$/i,
      /\/wishlist(\/.*)?$/i,
      /\/favourites?(\/.*)?$/i,
      /\/subscription(\/.*)?$/i,
      /\/subscriptions?(\/.*)?$/i,
      /\/address(\/.*)?$/i,
      /\/addresses?(\/.*)?$/i,
      /\/preferences?(\/.*)?$/i,
    ],
    priority: 60,
    notes: 'User account and authentication pages — interactive flows',
  },

  // ── Checkout / Cart Pages ─────────────────────────────────────────────────
  {
    category: 'Checkout / Cart Pages',
    patterns: [
      /\/cart\/?(\?.*)?$/i,
      /\/cart\.php(\?.*)?$/i,
      /\/basket\/?(\?.*)?$/i,
      /\/checkout(\/.*)?$/i,
      /\/checkout\.php(\/.*)?$/i,
      /\/order-confirmation(\/.*)?$/i,
      /\/order-complete(\/.*)?$/i,
      /\/thank-?you(\/.*)?$/i,
      /\/payment(\/.*)?$/i,
      /\/billing(\/.*)?$/i,
      /\/shipping(\/.*)?$/i,
      /\/compare\/?(\?.*)?$/i,           // Compare is highly interactive
      /\/compare\.php(\?.*)?$/i,
      /\/wishlist\.php(\?.*)?$/i,
      /\/store-?locator(\/.*)?$/i,       // Map-based store locator
      /\/find-a-?store(\/.*)?$/i,
      /\/find-?store(\/.*)?$/i,
    ],
    priority: 55,
    notes: 'Shopping cart, checkout, compare, and interactive tool pages',
  },

  // ── Policy / Legal Pages ──────────────────────────────────────────────────
  {
    category: 'Policy / Legal Pages',
    patterns: [
      /\/privacy(-policy)?\/?$/i,
      /\/terms(-of-?(service|use))?\/?$/i,
      /\/terms-and-conditions\/?$/i,
      /\/legal(\/.*)?$/i,
      /\/disclaimer\/?$/i,
      /\/cookie(-policy)?\/?$/i,
      /\/cookies\/?$/i,
      /\/gdpr\/?$/i,
      /\/accessibility(-statement)?\/?$/i,
      /\/return(-policy)?\/?$/i,
      /\/refund(-policy)?\/?$/i,
      /\/shipping(-policy)?\/?$/i,
      /\/delivery-policy\/?$/i,
      /\/intellectual-property\/?$/i,
      /\/copyright\/?$/i,
      /\/dmca\/?$/i,
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
      /\/docs?(\/.*)?$/i,
      /\/documentation(\/.*)?$/i,
      /\/faq\/?$/i,
      /\/faqs\/?$/i,
      /\/knowledge-?base(\/.*)?$/i,
      /\/kb(\/.*)?$/i,
      /\/guides?(\/.*)?$/i,
      /\/tutorials?(\/.*)?$/i,
      /\/how-?to(\/.*)?$/i,
      /\/instructions?(\/.*)?$/i,
      /\/manual(\/.*)?$/i,
      /\/wiki(\/.*)?$/i,
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
      /\/special\/.+/i,
      /\/deal\/.+/i,
      /\/sale\/.+/i,
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
      /\/our-team\/?$/i,
      /\/careers?\/?$/i,
      /\/jobs?\/?$/i,
      /\/work-?with-?us\/?$/i,
      /\/investors?\/?$/i,
      /\/investor-?relations?\/?$/i,
      /\/sitemap\/?$/i,
      /\/404\/?$/i,
      /\/not-?found\/?$/i,
      /\/locations?\/?$/i,
      /\/our-locations?\/?$/i,
      /\/stores?\/?$/i,
      /\/partnerships?\/?$/i,
      /\/affiliate\/?$/i,
      /\/sustainability\/?$/i,
      /\/responsibility\/?$/i,
      /\/mission\/?$/i,
      /\/values?\/?$/i,
      /\/history\/?$/i,
      /\/how-it-works?\/?$/i,
      /\/why-us\/?$/i,
      /\/testimonials?\/?$/i,
      /\/reviews?\/?$/i,
      /\/awards?\/?$/i,
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
