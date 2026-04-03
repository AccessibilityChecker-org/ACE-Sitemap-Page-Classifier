---
name: ACE Sitemap Page Classifier Project
description: Internal quoting tool for AccessibilityChecker.org — scans sitemaps, classifies pages by template/content/unique/dynamic, applies weighted pricing, recommends managed accessibility tiers
type: project
---

Full Next.js 14 App Router app built at `c:/Users/Gabriel/Downloads/AC_Weighted_Pages_Calculator/`.

**Why:** AccessibilityChecker.org needs a quoting tool that prices fairly based on actual remediation effort — a site with 6,000 product pages all using the same template doesn't need 6,000 full audits.

**Stack:** Next.js 14, TypeScript, Tailwind CSS, jsPDF (client-side PDF), fast-xml-parser (server-side sitemap parsing), SSE streaming for progress.

**Key files:**
- `config/pricing.ts` — All managed plans, add-on prices, default page weights (edit here to change pricing)
- `lib/pricing/engine.ts` — Pure pricing calculations
- `lib/classification/rules.ts` — Extensible URL classification rules
- `lib/demo/demoData.ts` — gemstoneking.com demo dataset
- `app/api/analyze/route.ts` — SSE streaming analysis endpoint
- `lib/export/pdf.ts` — Client-side jsPDF quote generator

**Page weights defaults:** template=1.0, unique=1.0, content=0.2, dynamic=1.2

**How to apply:** When making changes, understand the classification pipeline: URL → rules.ts pattern matching → clusterer.ts template grouping → classifier.ts type assignment → pricing/engine.ts weighted count → recommendation tier.
