# ACE™ Sitemap Page Classifier

**Internal quoting tool for AccessibilityChecker.org**

Scans a sitemap, classifies pages, detects template repetition, applies weighted pricing, recommends managed accessibility tiers, and generates quote outputs.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — click **Demo: Shopify Jewelry** to see immediate results.

## Features

- **Sitemap Fetching** — Handles sitemap index files with recursive sub-sitemap fetching
- **Platform Detection** — Identifies Shopify, WordPress, Webflow, Squarespace, Magento, BigCommerce
- **Template Clustering** — Groups URLs by path pattern to identify template vs. content pages
- **Weighted Pricing** — Template (1.0), Unique (1.0), Content (0.2), Dynamic (1.2) defaults
- **Managed Plan Recommendation** — Matches weighted page count to the correct pricing tier
- **Quote Builder** — Add-ons: extra domains, dedicated team, PDF pages, VPATs
- **Exports** — CSV, copy-to-clipboard text summary, jsPDF branded PDF report
- **SSE Streaming** — Real-time progress updates during analysis

## Input Methods

1. **Sitemap URL** — Fetches and parses any sitemap.xml (server-side, handles CORS)
2. **Paste XML** — Paste raw sitemap XML content
3. **Paste URLs** — One URL per line or comma-separated

## Pricing Plans

Small Sites → Enterprise 7XL (up to 50,000 weighted pages)

Add-ons: Dedicated Team (+$1,500/mo), Extra PDF Pages ($3/page), Additional VPATs ($500 each), Extra Domains (+15% base/mo)
