import type { Platform } from '@/types'

interface DetectionSignal {
  platform: Platform
  pattern: RegExp
  weight: number
}

const DETECTION_SIGNALS: DetectionSignal[] = [
  // ── Shopify ──────────────────────────────────────────────────────────────
  { platform: 'Shopify', pattern: /myshopify\.com/i,          weight: 10 },
  { platform: 'Shopify', pattern: /\/collections\/.+/i,       weight: 4  },
  { platform: 'Shopify', pattern: /\/products\/.+/i,          weight: 3  },
  { platform: 'Shopify', pattern: /\/blogs\/.+\/.+/i,         weight: 3  },
  { platform: 'Shopify', pattern: /\/cart\/?$/i,              weight: 2  },
  { platform: 'Shopify', pattern: /\/checkouts?\//i,          weight: 2  },
  { platform: 'Shopify', pattern: /cdn\.shopify\.com/i,       weight: 10 },
  { platform: 'Shopify', pattern: /shop\.app/i,               weight: 5  },

  // ── WordPress ────────────────────────────────────────────────────────────
  { platform: 'WordPress', pattern: /\/wp-content\//i,        weight: 8  },
  { platform: 'WordPress', pattern: /\/wp-json\//i,           weight: 8  },
  { platform: 'WordPress', pattern: /\/wp-includes\//i,       weight: 8  },
  { platform: 'WordPress', pattern: /\?p=\d/i,                weight: 5  },
  { platform: 'WordPress', pattern: /\?page_id=\d/i,          weight: 5  },
  { platform: 'WordPress', pattern: /\/\d{4}\/\d{2}\/\d{2}\//i, weight: 3 },
  { platform: 'WordPress', pattern: /\/category\/.+/i,        weight: 2  },
  { platform: 'WordPress', pattern: /\/tag\/.+/i,             weight: 2  },
  { platform: 'WordPress', pattern: /\/author\/.+/i,          weight: 2  },
  { platform: 'WordPress', pattern: /\/feed\/?$/i,            weight: 3  },

  // ── WooCommerce (WordPress + ecommerce) ──────────────────────────────────
  { platform: 'WooCommerce', pattern: /\/wp-content\//i,      weight: 3  },
  { platform: 'WooCommerce', pattern: /\/product\/.+/i,       weight: 5  },
  { platform: 'WooCommerce', pattern: /\/product-category\/.+/i, weight: 5 },
  { platform: 'WooCommerce', pattern: /\/shop\/?$/i,          weight: 4  },
  { platform: 'WooCommerce', pattern: /\/cart\/?$/i,          weight: 3  },
  { platform: 'WooCommerce', pattern: /\/checkout\/?/i,       weight: 3  },
  { platform: 'WooCommerce', pattern: /\/my-account\/?/i,     weight: 4  },
  { platform: 'WooCommerce', pattern: /woocommerce/i,         weight: 8  },

  // ── Webflow ──────────────────────────────────────────────────────────────
  { platform: 'Webflow', pattern: /\.webflow\.io/i,           weight: 10 },
  { platform: 'Webflow', pattern: /webflow\.com/i,            weight: 6  },
  { platform: 'Webflow', pattern: /\/cms\//i,                 weight: 2  },

  // ── Squarespace ──────────────────────────────────────────────────────────
  { platform: 'Squarespace', pattern: /squarespace\.com/i,    weight: 10 },
  { platform: 'Squarespace', pattern: /static\.squarespace\.com/i, weight: 10 },
  { platform: 'Squarespace', pattern: /\/s\/[a-zA-Z0-9_-]+/i, weight: 2 },

  // ── Wix ──────────────────────────────────────────────────────────────────
  { platform: 'Wix', pattern: /wix\.com/i,                    weight: 10 },
  { platform: 'Wix', pattern: /wixsite\.com/i,                weight: 10 },
  { platform: 'Wix', pattern: /static\.parastorage\.com/i,    weight: 8  },
  { platform: 'Wix', pattern: /\/wix-image\//i,               weight: 5  },

  // ── Magento ──────────────────────────────────────────────────────────────
  { platform: 'Magento', pattern: /\/catalog\/product\//i,    weight: 8  },
  { platform: 'Magento', pattern: /\/catalog\/category\//i,   weight: 6  },
  { platform: 'Magento', pattern: /\/magento\//i,             weight: 6  },
  { platform: 'Magento', pattern: /mage\.js/i,                weight: 5  },
  { platform: 'Magento', pattern: /\/checkout\/cart\//i,      weight: 3  },

  // ── BigCommerce ──────────────────────────────────────────────────────────
  { platform: 'BigCommerce', pattern: /bigcommerce\.com/i,    weight: 10 },
  { platform: 'BigCommerce', pattern: /mybigcommerce\.com/i,  weight: 10 },
  { platform: 'BigCommerce', pattern: /\/product\.php/i,      weight: 4  },
  { platform: 'BigCommerce', pattern: /\/category\.php/i,     weight: 4  },
  { platform: 'BigCommerce', pattern: /\/cart\.php/i,         weight: 4  },
  { platform: 'BigCommerce', pattern: /\/account\.php/i,      weight: 3  },

  // ── PrestaShop ───────────────────────────────────────────────────────────
  { platform: 'PrestaShop', pattern: /prestashop/i,           weight: 8  },
  { platform: 'PrestaShop', pattern: /\/index\.php\?id_product=/i, weight: 6 },
  { platform: 'PrestaShop', pattern: /\/index\.php\?id_category=/i, weight: 6 },
  { platform: 'PrestaShop', pattern: /\/index\.php\?controller=product/i, weight: 5 },
  { platform: 'PrestaShop', pattern: /\/index\.php\?controller=category/i, weight: 5 },
  { platform: 'PrestaShop', pattern: /\/module\/ps_/i,        weight: 4  },
]

export function detectPlatform(
  urls: string[]
): { platform: Platform; confidence: 'high' | 'medium' | 'low' } {
  if (urls.length === 0) {
    return { platform: 'Custom / Unknown', confidence: 'low' }
  }

  // Sample up to 500 URLs for performance
  const sample = urls.slice(0, 500)
  const scores = new Map<Platform, number>()

  for (const url of sample) {
    for (const signal of DETECTION_SIGNALS) {
      if (signal.pattern.test(url)) {
        scores.set(signal.platform, (scores.get(signal.platform) ?? 0) + signal.weight)
      }
    }
  }

  if (scores.size === 0) {
    return { platform: 'Custom / Unknown', confidence: 'low' }
  }

  // Sort by score descending
  const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1])
  const [bestPlatform, bestScore] = sorted[0]
  const secondScore = sorted[1]?.[1] ?? 0

  // WooCommerce needs both WordPress signals and WooCommerce signals to win
  // If WordPress and WooCommerce are both high, prefer WooCommerce
  const wpScore  = scores.get('WordPress')  ?? 0
  const wooScore = scores.get('WooCommerce') ?? 0
  if (wooScore > 0 && wpScore > 0) {
    // Demote pure WordPress if WooCommerce evidence is strong
    if (wooScore >= wpScore * 0.6 && bestPlatform === 'WordPress') {
      // WooCommerce is close enough — call it WooCommerce
      scores.set('WordPress', 0)
    }
  }

  // Re-sort after adjustment
  const sortedFinal = Array.from(scores.entries()).sort((a, b) => b[1] - a[1])
  const finalPlatform = sortedFinal[0][0]
  const finalBest     = sortedFinal[0][1]
  const finalSecond   = sortedFinal[1]?.[1] ?? 0

  let confidence: 'high' | 'medium' | 'low'
  if (finalBest >= 15) {
    confidence = 'high'
  } else if (finalBest >= 5) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // Reduce confidence if two platforms are close
  if (finalSecond > 0 && finalBest / finalSecond < 1.5) {
    confidence = confidence === 'high' ? 'medium' : 'low'
  }

  return { platform: finalPlatform, confidence }
}
