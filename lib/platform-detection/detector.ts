import type { Platform } from '@/types'

interface DetectionSignal {
  platform: Platform
  pattern: RegExp
  weight: number
}

const DETECTION_SIGNALS: DetectionSignal[] = [
  // Shopify
  { platform: 'Shopify', pattern: /\/collections\//i, weight: 3 },
  { platform: 'Shopify', pattern: /\/products\//i, weight: 2 },
  { platform: 'Shopify', pattern: /myshopify\.com/i, weight: 5 },
  { platform: 'Shopify', pattern: /\/cart$/i, weight: 1 },
  { platform: 'Shopify', pattern: /\/blogs\//i, weight: 2 },

  // WordPress
  { platform: 'WordPress', pattern: /\/wp-content\//i, weight: 5 },
  { platform: 'WordPress', pattern: /\/wp-json\//i, weight: 5 },
  { platform: 'WordPress', pattern: /[?&]p=\d/i, weight: 4 },
  { platform: 'WordPress', pattern: /\/wp-includes\//i, weight: 5 },
  { platform: 'WordPress', pattern: /\?page_id=\d/i, weight: 4 },
  { platform: 'WordPress', pattern: /\/\d{4}\/\d{2}\/\d{2}\//i, weight: 2 },

  // Webflow
  { platform: 'Webflow', pattern: /\.webflow\.io/i, weight: 5 },
  { platform: 'Webflow', pattern: /webflow\.com/i, weight: 4 },

  // Squarespace
  { platform: 'Squarespace', pattern: /squarespace\.com/i, weight: 5 },
  { platform: 'Squarespace', pattern: /\/s\/[a-zA-Z0-9_-]+/i, weight: 1 },

  // Magento
  { platform: 'Magento', pattern: /\/catalog\/product\//i, weight: 5 },
  { platform: 'Magento', pattern: /\/catalog\/category\//i, weight: 4 },
  { platform: 'Magento', pattern: /\/magento\//i, weight: 4 },

  // BigCommerce
  { platform: 'BigCommerce', pattern: /bigcommerce\.com/i, weight: 5 },
  { platform: 'BigCommerce', pattern: /mybigcommerce\.com/i, weight: 5 },
  { platform: 'BigCommerce', pattern: /\/product\.php/i, weight: 2 },
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
        const current = scores.get(signal.platform) || 0
        scores.set(signal.platform, current + signal.weight)
      }
    }
  }

  if (scores.size === 0) {
    return { platform: 'Custom / Unknown', confidence: 'low' }
  }

  // Find the platform with the highest score
  let bestPlatform: Platform = 'Custom / Unknown'
  let bestScore = 0
  let secondScore = 0

  for (const [platform, score] of Array.from(scores.entries())) {
    if (score > bestScore) {
      secondScore = bestScore
      bestScore = score
      bestPlatform = platform
    } else if (score > secondScore) {
      secondScore = score
    }
  }

  // Determine confidence based on score and margin
  let confidence: 'high' | 'medium' | 'low'
  if (bestScore >= 10) {
    confidence = 'high'
  } else if (bestScore >= 4) {
    confidence = 'medium'
  } else {
    confidence = 'low'
  }

  // If top two platforms are very close, lower confidence
  if (secondScore > 0 && bestScore / secondScore < 1.5) {
    confidence = confidence === 'high' ? 'medium' : 'low'
  }

  return { platform: bestPlatform, confidence }
}
