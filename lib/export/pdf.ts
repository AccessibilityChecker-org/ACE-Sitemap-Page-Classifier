import type { AnalysisResult, PricingRecommendation, QuoteCalculation, QuoteBuilderState } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type RGB = [number, number, number]

type DocType = InstanceType<typeof import('jspdf').jsPDF>

// ─── Color palette ────────────────────────────────────────────────────────────

const GREEN:      RGB = [22, 163, 74]
const GREEN_DARK: RGB = [15, 107, 47]
const GREEN_900:  RGB = [20, 83, 45]
const GREEN_100:  RGB = [220, 252, 231]
const GREEN_50:   RGB = [240, 253, 244]
const GRAY_900:   RGB = [17, 24, 39]
const GRAY_700:   RGB = [55, 65, 81]
const GRAY_500:   RGB = [107, 114, 128]
const GRAY_400:   RGB = [156, 163, 175]
const GRAY_200:   RGB = [229, 231, 235]
const GRAY_100:   RGB = [243, 244, 246]
const WHITE:      RGB = [255, 255, 255]
const AMBER_50:   RGB = [255, 251, 235]
const AMBER_600:  RGB = [217, 119, 6]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function trunc(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s
}

function makeRef(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 900 + 100)
  return `ACE-${datePart}-${rand}`
}

/** Format ISO date (YYYY-MM-DD) or a human string into a readable date */
function formatDateValue(val: string): string {
  if (!val) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }
  return val
}

/** Generate a concise executive summary paragraph */
function generateExecutiveSummary(
  analysis: AnalysisResult,
  recommendation: PricingRecommendation,
  quoteState: QuoteBuilderState,
): string {
  const client  = quoteState.clientCompany || analysis.domain
  const plan    = recommendation.weightedPlan?.name ?? 'Custom Plan'
  const contact = quoteState.clientContact ? ` for ${quoteState.clientContact}` : ''

  const savingsPart = recommendation.rawPlan && recommendation.annualSavings > 0
    ? ` ACE™ weighted pricing reduces billable scope from ${analysis.rawPageCount.toLocaleString()} to ${analysis.weightedPageCount.toLocaleString()} pages — recognising that template-driven pages require far less remediation effort — saving ${fmt(recommendation.annualSavings)} per year versus standard per-page pricing.`
    : ''

  return (
    `This proposal${contact} presents a fully managed web accessibility service for ${client} under the ${plan} plan. ` +
    `AccessibilityChecker.org will handle code-level WCAG\u00a02.2\u00a0AA remediation, continuous monitoring, expert audits, and VPAT reporting — ` +
    `covering all ongoing compliance obligations as your site evolves.` +
    savingsPart
  )
}

/** Plan features for the What's Included section */
function getPlanFeatures(
  plan: { auditFrequency: string; vpatIncluded: string; defaultPdfPages: number },
  dedicatedTeam: boolean,
): string[] {
  return [
    'Full platform access — scanning, monitoring, and AI-assisted fixes',
    'Code-level remediation by our development team, covering both initial remediation and any new issues that arise. Typical turnaround: ~3 business days for content changes, up to 2 weeks for new screens, and up to 2 months for complete redesigns',
    `${plan.auditFrequency} manual expert accessibility audits`,
    `${plan.vpatIncluded} VPAT / WCAG conformance report per year`,
    `${plan.defaultPdfPages.toLocaleString()} PDF pages remediated per year`,
    dedicatedTeam
      ? 'Dedicated Project Coordinator assigned within 48 hours of contract signing'
      : 'Shared Project Coordinator support included',
    'Ongoing support, reporting, and compliance guidance',
    'ADA / Section 508 / WCAG 2.2 AA coverage',
  ]
}

// ─── Page furniture ───────────────────────────────────────────────────────────

/**
 * Slim document header on content pages (pages 2+).
 * A 2.5mm green accent rule at the top, then brand text + ref in
 * the document's own typography — no heavy banner.
 */
function drawPageHeader(doc: DocType, pageW: number, margin: number, ref: string) {
  // Thin green top rule
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageW, 2.5, 'F')
  // Brand name in green, reference number in gray
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...GREEN)
  doc.text('ACE™ Price Proposal  —  AccessibilityChecker.org', margin, 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY_400)
  doc.text(ref, pageW - margin, 9, { align: 'right' })
  // Thin gray separator line
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.25)
  doc.line(margin, 12.5, pageW - margin, 12.5)
}

/** Footer bar drawn on every content page */
function drawPageFooter(
  doc: DocType,
  pageW: number,
  pageH: number,
  margin: number,
  ref: string,
  p: number,
  total: number,
) {
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.25)
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...GRAY_400)
  doc.text(`AccessibilityChecker.org  ·  ACE™ Price Proposal  ·  ${ref}`, margin, pageH - 6)
  doc.text(`Page ${p} of ${total}`, pageW - margin, pageH - 6, { align: 'right' })
}

/**
 * Ensure at least `needed` mm of vertical space before the next element.
 * Adds a new page and redraws the slim running header when needed.
 */
function ensureSpace(
  doc: DocType,
  y: number,
  needed: number,
  pageH: number,
  margin: number,
  ref: string,
  pageW: number,
): number {
  const safeBottom = pageH - 20
  if (y + needed > safeBottom) {
    doc.addPage()
    drawPageHeader(doc, pageW, margin, ref)
    return 17   // y-start after slim header (rule 2.5mm + text 9mm + sep 12.5mm → content at 17)
  }
  return y
}

/**
 * Draw a section header: horizontal rule → uppercase overline → green bold title.
 * Returns the updated y cursor after the title.
 */
function drawSectionHeader(
  doc: DocType,
  y: number,
  overline: string,
  title: string,
  margin: number,
  pageW: number,
): number {
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.25)
  doc.line(margin, y, pageW - margin, y)
  y += 3.5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GRAY_400)
  doc.text(overline.toUpperCase(), margin, y)
  y += 4.5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...GREEN)
  doc.text(title, margin, y)
  y += 7

  return y
}

/** Draw a filled green circle + white checkmark bullet at (x, y) */
function drawCheckmark(doc: DocType, x: number, y: number) {
  const cx = x + 2.4
  const cy = y - 1.8
  doc.setFillColor(...GREEN)
  doc.circle(cx, cy, 2.4, 'F')
  doc.setDrawColor(...WHITE)
  doc.setLineWidth(0.65)
  doc.line(cx - 1.05, cy + 0.15, cx - 0.1, cy + 1.15)
  doc.line(cx - 0.1, cy + 1.15, cx + 1.4, cy - 1.0)
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generatePDFQuote(
  analysis: AnalysisResult,
  recommendation: PricingRecommendation,
  quote: QuoteCalculation,
  quoteState: QuoteBuilderState,
): Promise<void> {
  let jsPDFModule: typeof import('jspdf')
  let autoTableModule: typeof import('jspdf-autotable')
  try {
    jsPDFModule     = await import('jspdf')
    autoTableModule = await import('jspdf-autotable')
  } catch (err) {
    throw new Error(`Failed to load PDF libraries: ${err instanceof Error ? err.message : String(err)}`)
  }

  const { jsPDF } = jsPDFModule
  const autoTable = autoTableModule.default
  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW  = doc.internal.pageSize.getWidth()   // 210 mm
  const pageH  = doc.internal.pageSize.getHeight()  // 297 mm
  const margin = 16
  const cW     = pageW - margin * 2                  // 178 mm

  const clientName   = quoteState.clientCompany || analysis.domain
  const billingLabel = quoteState.billingCycle === 'annual' ? 'Annual' : 'Monthly'
  const ref          = makeRef()
  const dateStr      = new Date(analysis.analyzedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ══════════════════════════════════════════════════════════════════════════

  const stripW = 28

  // Right accent strip (soft green)
  doc.setFillColor(209, 250, 229)
  doc.rect(pageW - stripW, 0, stripW, pageH, 'F')

  // Full-width green header band
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageW - stripW, 48, 'F')
  doc.setFillColor(...GREEN_DARK)
  doc.rect(pageW - stripW, 0, stripW, 48, 'F')

  // Brand name
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('AccessibilityChecker.org', margin, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(187, 247, 208)
  doc.text('Managed Web Accessibility Services', margin, 30)

  // ACE™ badge
  doc.setFillColor(255, 255, 255, 0.15)
  doc.roundedRect(pageW - stripW - 50, 11, 47, 13, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text('ACE™ CLASSIFIER', pageW - stripW - 26.5, 19.5, { align: 'center' })

  // Decorative dots in right strip
  doc.setFillColor(...GREEN)
  const dotY = [70, 95, 120, 150, 180, 215]
  dotY.forEach(dy => doc.circle(pageW - stripW / 2, dy, 2.2, 'F'))

  // Green accent rule above title
  doc.setFillColor(...GREEN)
  doc.rect(margin, 115, 56, 2.5, 'F')

  // Main title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(32)
  doc.setTextColor(...GRAY_900)
  doc.text('ACE™ Price Proposal', margin, 131)

  // "Prepared for" line — bold dark, matches good-example styling
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...GRAY_900)
  doc.text(`Prepared for ${trunc(clientName, 34)}`, margin, 144)

  // Date + ref
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY_500)
  doc.text(`${dateStr}  |  Ref: ${ref}`, margin, 155)

  // Confidential notice
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_400)
  doc.text('CONFIDENTIAL — Prepared exclusively for the named recipient.', margin, pageH - 32)

  // Bottom footer bar (cover)
  doc.setFillColor(...GREEN)
  doc.rect(0, pageH - 20, pageW - stripW, 20, 'F')
  doc.setFillColor(...GREEN_DARK)
  doc.rect(pageW - stripW, pageH - 20, stripW, 20, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...WHITE)
  doc.text('accessibilitychecker.org', margin, pageH - 7.5)

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT PAGES — page 2 onward
  // ══════════════════════════════════════════════════════════════════════════

  doc.addPage()
  drawPageHeader(doc, pageW, margin, ref)
  let y = 17

  // ── SECTION: Client & Proposal Info ──────────────────────────────────────

  y = ensureSpace(doc, y, 55, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Proposal Details', 'Client & Proposal Information', margin, pageW)

  const colW  = (cW - 6) / 2
  const colRx = margin + colW + 6

  // Column heading pills
  const colLabelH = 7
  doc.setFillColor(...GREEN)
  doc.roundedRect(margin, y, colW, colLabelH, 1.5, 1.5, 'F')
  doc.roundedRect(colRx, y, colW, colLabelH, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...WHITE)
  doc.text('Prepared For', margin + colW / 2, y + 4.8, { align: 'center' })
  doc.text('Prepared By',  colRx  + colW / 2, y + 4.8, { align: 'center' })
  y += colLabelH + 1

  const clientRows = ([
    ['Company',  quoteState.clientCompany || analysis.domain],
    ['Contact',  quoteState.clientContact],
    ['Email',    quoteState.clientEmail],
    ['Phone',    quoteState.clientPhone],
    ['Website',  quoteState.clientWebsite || analysis.domain],
  ] as [string, string][]).filter(([, v]) => v)

  const salesRows = ([
    ['Sales Rep', quoteState.salesRep],
    ['Email',     quoteState.salesEmail],
    ['Company',   'AccessibilityChecker.org'],
    ['Website',   'accessibilitychecker.org'],
  ] as [string, string][]).filter(([, v]) => v)

  const maxRows = Math.max(clientRows.length, salesRows.length)
  const rowH    = 6.8

  for (let i = 0; i < maxRows; i++) {
    const ry        = y + i * rowH
    const fillColor: RGB = i % 2 === 0 ? [249, 250, 251] : WHITE
    doc.setFillColor(...fillColor)
    doc.rect(margin, ry, colW, rowH, 'F')
    doc.rect(colRx,  ry, colW, rowH, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY_500)
    if (clientRows[i]) doc.text(clientRows[i][0], margin + 3, ry + 4.5)
    if (salesRows[i])  doc.text(salesRows[i][0],  colRx  + 3, ry + 4.5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_700)
    if (clientRows[i]) doc.text(trunc(clientRows[i][1], 28), margin + 22, ry + 4.5)
    if (salesRows[i])  doc.text(trunc(salesRows[i][1], 28),  colRx  + 22, ry + 4.5)
  }

  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, colW, maxRows * rowH, 1, 1, 'S')
  doc.roundedRect(colRx,  y, colW, maxRows * rowH, 1, 1, 'S')

  y += maxRows * rowH + 10

  // ── SECTION: Executive Summary ────────────────────────────────────────────
  // Uses green brand colors (not indigo) — generous padding prevents overflow.

  const execSummary = generateExecutiveSummary(analysis, recommendation, quoteState)
  const execLines   = doc.splitTextToSize(execSummary, cW - 16) as string[]
  const execH       = execLines.length * 5.5 + 18    // 9mm top pad + lines + 9mm bottom pad
  y = ensureSpace(doc, y, execH + 16, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Why This Matters', 'Executive Summary', margin, pageW)

  doc.setFillColor(...GREEN_50)
  doc.roundedRect(margin, y, cW, execH, 2, 2, 'F')
  doc.setFillColor(...GREEN)
  doc.rect(margin, y, 3.5, execH, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...GRAY_700)
  doc.text(execLines, margin + 10, y + 9)
  y += execH + 10

  // ── SECTION: Website Analysis Summary ────────────────────────────────────
  // 2 × 2 KPI layout: each cell is (cW-4)/2 ≈ 87 mm wide — eliminates any
  // risk of label text wrapping inside cramped narrow dashboard-style cells.

  const halfW   = (cW - 4) / 2   // ~87 mm per cell
  const kpiRowH = 28              // height of each KPI row

  y = ensureSpace(doc, y, 80, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Sitemap Classification Results', 'Website Analysis Summary', margin, pageW)

  // 2 rows × 2 columns of KPI stats
  const kpis2x2: Array<[[string, string, string?], [string, string, string?]]> = [
    [
      ['Raw Pages Found',   analysis.rawPageCount.toLocaleString()],
      ['Weighted Pages',    analysis.weightedPageCount.toLocaleString()],
    ],
    [
      ['Weight Reduction',  `${recommendation.weightReductionPercent.toFixed(1)}%`],
      ['Platform Detected', analysis.platform, `${analysis.platformConfidence} confidence`],
    ],
  ]

  for (let rowIdx = 0; rowIdx < kpis2x2.length; rowIdx++) {
    const ry   = y + rowIdx * (kpiRowH + 2)
    const rightX = margin + halfW + 4

    const cells: [number, [string, string, string?]][] = [
      [margin, kpis2x2[rowIdx][0]],
      [rightX, kpis2x2[rowIdx][1]],
    ]

    for (const [cx, [label, value, sub]] of cells) {
      const midX = cx + halfW / 2
      doc.setFillColor(...GRAY_100)
      doc.roundedRect(cx, ry, halfW, kpiRowH, 2, 2, 'F')
      // Label (small, above value)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...GRAY_500)
      doc.text(label, midX, ry + 7, { align: 'center' })
      // Value (large, prominent)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.setTextColor(...GRAY_900)
      doc.text(value, midX, ry + 19, { align: 'center' })
      // Sub-label (confidence, etc.)
      if (sub) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(...GRAY_400)
        doc.text(sub, midX, ry + 25, { align: 'center' })
      }
    }
  }
  // Advance past both rows (2 × 28 mm) plus the inter-row gap (2 mm) and spacing
  y += 2 * kpiRowH + 2 + 6

  // Category breakdown table
  const topCategories = [...analysis.categories]
    .sort((a, b) => b.weightedCount - a.weightedCount)
    .slice(0, 8)

  let catFirstPage = true
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Raw Pages', 'Weighted Pages', '% of Site']],
    body: topCategories.map((c) => [
      c.category,
      c.rawCount.toLocaleString(),
      c.weightedCount.toLocaleString(),
      c.percentOfSite.toFixed(1) + '%',
    ]),
    theme: 'plain',
    headStyles: {
      textColor: GRAY_500,
      fillColor: GRAY_100,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      textColor: GRAY_700,
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] as RGB },
    columnStyles: {
      0: { cellWidth: cW - 54 },
      1: { cellWidth: 18, halign: 'right' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      if (!catFirstPage) drawPageHeader(doc, pageW, margin, ref)
      catFirstPage = false
    },
  })
  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 35) + 6

  // Weighted pricing impact callout (amber) — dynamically sized to fit text
  if (recommendation.rawPlan && recommendation.annualSavings > 0) {
    const impactStr = (
      `Without weighted pricing: ${recommendation.rawPlan.name} at ${fmt(recommendation.rawMonthlyPrice)}/mo  ·  ` +
      `Client saves ${fmt(recommendation.annualSavings)}/yr with effort-based pricing.`
    )
    const impactLines = doc.splitTextToSize(impactStr, cW - 16) as string[]
    const impactH     = impactLines.length * 5.2 + 14

    y = ensureSpace(doc, y, impactH + 4, pageH, margin, ref, pageW)
    doc.setFillColor(...AMBER_50)
    doc.roundedRect(margin, y, cW, impactH, 2, 2, 'F')
    doc.setFillColor(...AMBER_600)
    doc.rect(margin, y, 3.5, impactH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...AMBER_600)
    doc.text('WEIGHTED PRICING IMPACT', margin + 8, y + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_700)
    doc.text(impactLines, margin + 8, y + 11)
    y += impactH + 6
  }

  // ── SECTION: Plan Summary ─────────────────────────────────────────────────

  y = ensureSpace(doc, y, 42, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Recommended Service', 'Plan Summary', margin, pageW)

  doc.setFillColor(...GREEN_50)
  doc.roundedRect(margin, y, cW, 26, 2, 2, 'F')
  doc.setFillColor(...GREEN)
  doc.roundedRect(margin, y, 4, 26, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...GREEN_DARK)
  doc.text(quoteState.basePlan?.name ?? 'Custom Plan', margin + 10, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY_700)
  const planMeta = [
    `Pages: ${(quoteState.basePlan?.maxWeightedPages ?? 0).toLocaleString()}`,
    `Domains: ${1 + (quoteState.extraDomains ?? 0)}`,
    `Billing: ${billingLabel}`,
    `Audits: ${quoteState.basePlan?.auditFrequency ?? '—'}`,
  ].join('  ·  ')
  doc.text(planMeta, margin + 10, y + 20.5)
  y += 32

  // ── SECTION: What's Included ──────────────────────────────────────────────

  y = ensureSpace(doc, y, 40, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Service Scope', "What's Included", margin, pageW)

  const features = getPlanFeatures(
    quoteState.basePlan ?? { auditFrequency: 'Quarterly', vpatIncluded: '1/year', defaultPdfPages: 100 },
    quoteState.dedicatedTeam,
  )

  for (const feature of features) {
    const lines    = doc.splitTextToSize(feature, cW - 10) as string[]
    const featureH = lines.length * 4.9 + 3
    y = ensureSpace(doc, y, featureH, pageH, margin, ref, pageW)
    drawCheckmark(doc, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_700)
    doc.text(lines, margin + 9, y)
    y += featureH
  }
  y += 6

  // ── SECTION: Pricing ──────────────────────────────────────────────────────

  y = ensureSpace(doc, y, 80, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Investment Overview', 'Pricing', margin, pageW)

  const pricingBody: [string, string, string][] = []

  if (quoteState.basePlan) {
    pricingBody.push(['Base Plan', fmt(quote.baseMonthly) + '/mo', fmt(quoteState.basePlan.annualPrice)])
  }
  if (quote.extraDomainCost > 0) {
    pricingBody.push([
      `Extra Domains (${quoteState.extraDomains})`,
      fmt(quote.extraDomainCost) + '/mo',
      fmt(quote.extraDomainCost * 12),
    ])
  }
  if (quote.dedicatedTeamCost > 0) {
    pricingBody.push(['Dedicated Team Upgrade', fmt(quote.dedicatedTeamCost) + '/mo', fmt(quote.dedicatedTeamCost * 12)])
  }
  if (quote.oneTimePdfCost > 0) {
    pricingBody.push([`PDF Remediation (${quoteState.extraPdfPages} extra pages, one-time)`, '—', fmt(quote.oneTimePdfCost)])
  }
  if (quote.oneTimeVpatCost > 0) {
    pricingBody.push([`Additional VPATs (${quoteState.additionalVpats}, one-time)`, '—', fmt(quote.oneTimeVpatCost)])
  }

  const discountPct          = quoteState.discount ?? 0
  const discountMonthly      = discountPct > 0 ? Math.round(quote.monthlyTotal * discountPct / 100) : 0
  const monthlyAfterDiscount = quote.monthlyTotal - discountMonthly
  const annualAfterDiscount  = monthlyAfterDiscount * 12

  if (discountPct > 0) {
    pricingBody.push([
      `Special Discount (${discountPct}%)`,
      `−${fmt(discountMonthly)}/mo`,
      `−${fmt(discountMonthly * 12)}`,
    ])
  }

  let priceFirstPage = true
  autoTable(doc, {
    startY: y,
    head: [['ITEM', 'MONTHLY', 'ANNUAL']],
    body: pricingBody,
    foot: [['Monthly Total', fmt(monthlyAfterDiscount) + '/mo', fmt(annualAfterDiscount) + '/yr']],
    theme: 'plain',
    headStyles: {
      textColor: GRAY_500,
      fillColor: GRAY_100,
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
    },
    bodyStyles: {
      textColor: GRAY_700,
      fontSize: 10,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] as RGB },
    footStyles: {
      textColor: GREEN_900,
      fillColor: GREEN_100,
      fontSize: 11,
      fontStyle: 'bold',
      cellPadding: { top: 4.5, bottom: 4.5, left: 5, right: 5 },
    },
    columnStyles: {
      0: { cellWidth: cW - 56 },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      if (!priceFirstPage) drawPageHeader(doc, pageW, margin, ref)
      priceFirstPage = false
    },
  })

  y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 35) + 8

  // Year-1 total callout (shown only when one-time fees exist)
  if (quote.totalOneTime > 0) {
    y = ensureSpace(doc, y, 16, pageH, margin, ref, pageW)
    doc.setFillColor(...GREEN_50)
    doc.roundedRect(margin, y, cW, 14, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...GREEN_DARK)
    doc.text('Year 1 Total (includes one-time fees)', margin + 5, y + 6)
    doc.setFontSize(12)
    doc.text(fmt(quote.yearOneTotal), pageW - margin, y + 6, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY_500)
    doc.text(`One-time fees: ${fmt(quote.totalOneTime)}`, pageW - margin, y + 11, { align: 'right' })
    y += 20
  }

  // Savings callout (amber) — dynamically sized, no fixed-height text overflow
  if (recommendation.rawPlan && recommendation.annualSavings > 0) {
    const savingsStr = (
      `Without weighted pricing: ${recommendation.rawPlan.name} at ${fmt(recommendation.rawMonthlyPrice)}/mo.  ` +
      `Client saves ${fmt(recommendation.annualSavings)}/yr.`
    )
    const savingsLines = doc.splitTextToSize(savingsStr, cW - 16) as string[]
    const savingsH     = savingsLines.length * 5.2 + 14

    y = ensureSpace(doc, y, savingsH + 4, pageH, margin, ref, pageW)
    doc.setFillColor(...AMBER_50)
    doc.roundedRect(margin, y, cW, savingsH, 2, 2, 'F')
    doc.setFillColor(...AMBER_600)
    doc.rect(margin, y, 3.5, savingsH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...AMBER_600)
    doc.text('SAVINGS WITH WEIGHTED PRICING', margin + 8, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_700)
    doc.text(savingsLines, margin + 8, y + 12)
    y += savingsH + 6
  }

  // ── SECTION: Scope & Timeline ─────────────────────────────────────────────

  const scopeRows: [string, string][] = []
  if (quoteState.estimatedStart?.trim())      scopeRows.push(['Estimated Start',     formatDateValue(quoteState.estimatedStart)])
  if (quoteState.remediationTimeline?.trim()) scopeRows.push(['Initial Remediation', quoteState.remediationTimeline])
  if (quoteState.contractDuration?.trim())    scopeRows.push(['Contract Duration',   quoteState.contractDuration])

  if (scopeRows.length > 0) {
    const scopeH = scopeRows.length * 7.5 + 6
    y = ensureSpace(doc, y, scopeH + 30, pageH, margin, ref, pageW)
    y = drawSectionHeader(doc, y, 'Project Planning', 'Scope & Timeline', margin, pageW)

    doc.setFillColor(...GRAY_100)
    doc.roundedRect(margin, y, cW, scopeH, 2, 2, 'F')
    for (let i = 0; i < scopeRows.length; i++) {
      const ry = y + 3 + i * 7.5
      if (i > 0) {
        doc.setDrawColor(...GRAY_200)
        doc.setLineWidth(0.2)
        doc.line(margin + 4, ry, margin + cW - 4, ry)
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...GRAY_500)
      doc.text(scopeRows[i][0], margin + 5, ry + 5.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY_700)
      doc.text(scopeRows[i][1], margin + 58, ry + 5.5)
    }
    y += scopeH + 8

    // Quote validity notice
    if (quoteState.quoteValidUntil?.trim()) {
      y = ensureSpace(doc, y, 14, pageH, margin, ref, pageW)
      doc.setFillColor(...GREEN_50)
      doc.roundedRect(margin, y, cW, 12, 2, 2, 'F')
      doc.setFillColor(...GREEN)
      doc.rect(margin, y, 3.5, 12, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...GRAY_700)
      const validLabel = 'This proposal is valid until '
      doc.text(validLabel, margin + 8, y + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GREEN_DARK)
      doc.text(formatDateValue(quoteState.quoteValidUntil), margin + 8 + doc.getTextWidth(validLabel), y + 8)
      y += 18
    }
    y += 4
  }

  // ── SECTION: Notes (if any) ───────────────────────────────────────────────

  if (quoteState.notes?.trim()) {
    const noteLines = doc.splitTextToSize(quoteState.notes, cW) as string[]
    const noteH     = noteLines.length * 5.2 + 6
    y = ensureSpace(doc, y, noteH + 24, pageH, margin, ref, pageW)
    y = drawSectionHeader(doc, y, 'Additional Context', 'Notes', margin, pageW)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_700)
    doc.text(noteLines, margin, y)
    y += noteH + 10
  }

  // ── SECTION: Standard Terms ───────────────────────────────────────────────

  y = ensureSpace(doc, y, 50, pageH, margin, ref, pageW)
  y = drawSectionHeader(doc, y, 'Agreement Conditions', 'Standard Terms', margin, pageW)

  const terms = [
    'Managed plans require an annual commitment. Monthly prices shown for reference only.',
    'Prices are in USD. Payment accepted via invoice or credit card.',
    'Setup and onboarding are included at no additional cost.',
    'Priority onboarding: a Project Coordinator will be assigned within 48 hours of contract signing.',
    'Service can be upgraded mid-term; downgrades apply at renewal.',
  ]

  for (const term of terms) {
    const lines  = doc.splitTextToSize(term, cW - 10) as string[]
    const termH  = lines.length * 4.9 + 3
    y = ensureSpace(doc, y, termH, pageH, margin, ref, pageW)
    drawCheckmark(doc, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY_700)
    doc.text(lines, margin + 9, y)
    y += termH
  }
  y += 8

  // ── CTA / Closing contact line ────────────────────────────────────────────

  y = ensureSpace(doc, y, 18, pageH, margin, ref, pageW)
  doc.setDrawColor(...GRAY_200)
  doc.setLineWidth(0.25)
  doc.line(margin, y, pageW - margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY_500)
  const ctaLine = [
    'AccessibilityChecker.org',
    'https://www.accessibilitychecker.org',
    quoteState.salesEmail,
  ].filter(Boolean).join('  ·  ')
  doc.text(ctaLine, pageW / 2, y, { align: 'center' })

  // ── Footers on all content pages ──────────────────────────────────────────

  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    drawPageFooter(doc, pageW, pageH, margin, ref, p - 1, totalPages - 1)
  }

  const safeClient = clientName.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 30)
  doc.save(`ace-proposal-${safeClient}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
