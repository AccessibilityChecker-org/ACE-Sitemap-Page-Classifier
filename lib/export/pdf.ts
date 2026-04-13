import type { AnalysisResult, PricingRecommendation, QuoteCalculation, QuoteBuilderState } from '@/types'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

/** Truncate a string if it exceeds maxLen, adding ellipsis */
function trunc(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s
}

export async function generatePDFQuote(
  analysis: AnalysisResult,
  recommendation: PricingRecommendation,
  quote: QuoteCalculation,
  quoteState: QuoteBuilderState
): Promise<void> {
  // Dynamic imports — load both before doing any PDF work so we catch import failures early
  let jsPDFModule: typeof import('jspdf')
  let autoTableModule: typeof import('jspdf-autotable')

  try {
    jsPDFModule = await import('jspdf')
    autoTableModule = await import('jspdf-autotable')
  } catch (err) {
    throw new Error(`Failed to load PDF libraries: ${err instanceof Error ? err.message : String(err)}`)
  }

  const { jsPDF } = jsPDFModule
  const autoTable = autoTableModule.default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // Color palette — as [r, g, b] tuples spread into jsPDF calls
  const GREEN:       [number, number, number] = [22, 163, 74]
  const DARK_GREEN:  [number, number, number] = [15, 107, 47]
  const LIGHT_GREEN: [number, number, number] = [240, 253, 244]
  const GRAY_100:    [number, number, number] = [243, 244, 246]
  const GRAY_700:    [number, number, number] = [55, 65, 81]
  const WHITE:       [number, number, number] = [255, 255, 255]
  const AMBER_50:    [number, number, number] = [255, 251, 235]
  const AMBER_600:   [number, number, number] = [217, 119, 6]
  const SAVINGS_GREEN: [number, number, number] = [22, 101, 52]

  // ─── PAGE 1 ───────────────────────────────────────────────────────────────

  // Header bar
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('AccessibilityChecker.org', margin, 11)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ACE™ Sitemap Page Classifier — Quote Report', margin, 19)

  // Internal badge
  doc.setFillColor(...DARK_GREEN)
  doc.roundedRect(pageWidth - margin - 38, 5, 36, 8, 2, 2, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('INTERNAL TOOL', pageWidth - margin - 36, 10.5)

  // Domain / date
  let y = 35
  doc.setTextColor(...GRAY_700)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(analysis.domain, margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 6
  doc.text(
    `Platform: ${analysis.platform} (${analysis.platformConfidence} confidence)  |  Analyzed: ${new Date(analysis.analyzedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin,
    y
  )

  // Summary Stats box
  y += 8
  doc.setFillColor(...LIGHT_GREEN)
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'F')
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'S')

  doc.setTextColor(...DARK_GREEN)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('SITE ANALYSIS SUMMARY', margin + 4, y + 7)

  const stats = [
    { label: 'Raw Pages',      value: analysis.rawPageCount.toLocaleString() },
    { label: 'Layout Families', value: analysis.templateTypesCount.toString() },
    { label: 'Content Pages',  value: analysis.contentPagesCount.toLocaleString() },
    { label: 'Unique Pages',   value: analysis.uniquePagesCount.toString() },
    { label: 'Dynamic Pages',  value: analysis.dynamicPagesCount.toString() },
    { label: 'Weighted Pages', value: analysis.weightedPageCount.toLocaleString() },
  ]

  const statColWidth = contentWidth / stats.length
  stats.forEach((stat, i) => {
    const x = margin + i * statColWidth + statColWidth / 2
    doc.setTextColor(...GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(stat.value, x, y + 18, { align: 'center' })
    doc.setTextColor(...GRAY_700)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(stat.label, x, y + 25, { align: 'center' })
  })

  // Page Categories Table
  y += 40
  doc.setTextColor(...GRAY_700)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Page Categories Breakdown', margin, y)

  y += 4

  // Build category rows explicitly so column mapping is unambiguous.
  // Column order: [Category, Classification, Raw, Weighted, %]
  //   - Raw      := category's actual raw URL count from the scan
  //   - Weighted := category's computed weighted page count
  // The Total row sums the SAME rendered numeric fields, so sum(rows) == total.
  let rawTotal = 0
  let weightedTotal = 0
  let percentTotal = 0
  const categoryRows = analysis.categories.map((cat) => {
    const rawCount = cat.rawCount
    const weightedCount = cat.weightedCount
    const percentOfSite = cat.percentOfSite
    rawTotal += rawCount
    weightedTotal += weightedCount
    percentTotal += percentOfSite
    return [
      cat.category,
      trunc(cat.typeLabel, 32),            // prevent overflow in narrow column
      rawCount.toLocaleString(),           // Raw column — always cat.rawCount
      weightedCount.toLocaleString(),      // Weighted column — always cat.weightedCount
      `${percentOfSite}%`,
    ]
  })

  const totalRow = [
    'Total',
    '',
    rawTotal.toLocaleString(),
    weightedTotal.toLocaleString(),
    `${percentTotal.toFixed(1)}%`,
  ]

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Classification', 'Raw', 'Weighted', '%']],
    body: categoryRows,
    foot: [totalRow],
    theme: 'grid',
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: GRAY_700,
    },
    footStyles: {
      fillColor: LIGHT_GREEN,
      textColor: DARK_GREEN,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: GRAY_100,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 58 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  addFooter(doc, pageWidth, pageHeight, margin, 1)

  // ─── PAGE 2 ───────────────────────────────────────────────────────────────
  doc.addPage()

  // Slim header bar
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageWidth, 16, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('ACE™ Sitemap Page Classifier — Quote Report (continued)', margin, 10)

  y = 24

  // Recommended Plan
  doc.setTextColor(...GRAY_700)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Recommended Plan', margin, y)
  y += 5

  if (recommendation.weightedPlan) {
    doc.setFillColor(...LIGHT_GREEN)
    doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'F')
    doc.setDrawColor(...GREEN)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'S')

    doc.setTextColor(...DARK_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(recommendation.weightedPlan.name, margin + 6, y + 11)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_700)
    doc.text(
      `Up to ${recommendation.weightedPlan.maxWeightedPages.toLocaleString()} weighted pages`,
      margin + 6,
      y + 19
    )

    doc.setTextColor(...GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(fmt(recommendation.monthlyPrice) + '/mo', pageWidth - margin - 4, y + 14, { align: 'right' })

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_700)
    doc.text(
      `${fmt(recommendation.annualPrice)}/yr billed annually`,
      pageWidth - margin - 4, y + 22,
      { align: 'right' }
    )

    doc.setTextColor(...DARK_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(
      `Weight Reduction: ${recommendation.weightReductionPercent}% fewer effective pages vs. raw count`,
      margin + 6, y + 30
    )
  } else {
    // Exceeds max tier
    doc.setFillColor(...GRAY_100)
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F')
    doc.setTextColor(...GRAY_700)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Custom Enterprise Quote Required', margin + 6, y + 11)
  }

  y += 44

  // Savings box
  if (recommendation.rawPlan && recommendation.annualSavings > 0) {
    doc.setFillColor(...AMBER_50)
    doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F')
    doc.setDrawColor(...AMBER_600)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'S')

    doc.setTextColor(...AMBER_600)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('SAVINGS WITH WEIGHTED PRICING', margin + 4, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_700)
    doc.text(
      `Without weighted pricing: ${recommendation.rawPlan.name} at ${fmt(recommendation.rawMonthlyPrice)}/mo (${fmt(recommendation.rawAnnualPrice)}/yr)`,
      margin + 4, y + 16
    )

    // Fixed: use spread, not array-as-string cast
    doc.setTextColor(...SAVINGS_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `Client saves ${fmt(recommendation.annualSavings)}/yr with weighted pricing`,
      margin + 4, y + 23
    )
  }

  y += 36

  // Quote Summary table
  doc.setTextColor(...GRAY_700)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Quote Summary', margin, y)
  y += 5

  const quoteRows: [string, string][] = [
    ['Base Monthly', fmt(quote.baseMonthly) + '/mo'],
  ]
  if (quote.extraDomainCost > 0)   quoteRows.push(['Extra Domains', fmt(quote.extraDomainCost) + '/mo'])
  if (quote.dedicatedTeamCost > 0) quoteRows.push(['Dedicated Team Upgrade', fmt(quote.dedicatedTeamCost) + '/mo'])
  quoteRows.push(['Monthly Total', fmt(quote.monthlyTotal) + '/mo'])
  quoteRows.push(['Annual Total',  fmt(quote.annualTotal) + '/yr'])
  if (quote.oneTimePdfCost > 0)   quoteRows.push(['Extra PDF Pages (one-time)', fmt(quote.oneTimePdfCost)])
  if (quote.oneTimeVpatCost > 0)  quoteRows.push(['Additional VPATs (one-time)', fmt(quote.oneTimeVpatCost)])
  if (quote.totalOneTime > 0)     quoteRows.push(['Year 1 Total', fmt(quote.yearOneTotal)])

  const highlightRows = new Set(['Monthly Total', 'Annual Total', 'Year 1 Total'])

  autoTable(doc, {
    startY: y,
    body: quoteRows,
    theme: 'plain',
    bodyStyles: {
      fontSize: 9,
      textColor: GRAY_700,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: contentWidth - 80, halign: 'right', fontStyle: 'bold' },
    },
    // Fixed: proper parentheses so section check always applies
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowLabel = (data.row.raw as [string, string])[0]
        if (highlightRows.has(rowLabel)) {
          data.cell.styles.fillColor = LIGHT_GREEN
          data.cell.styles.textColor = DARK_GREEN
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
    margin: { left: margin, right: margin },
  })

  // Notes section
  if (quoteState.notes?.trim()) {
    const tableBottom =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40
    const notesY = tableBottom + 10
    if (notesY < pageHeight - 30) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...GRAY_700)
      doc.text('Notes', margin, notesY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const splitNotes = doc.splitTextToSize(quoteState.notes, contentWidth)
      doc.text(splitNotes, margin, notesY + 7)
    }
  }

  addFooter(doc, pageWidth, pageHeight, margin, 2)

  const filename = `ace-quote-${analysis.domain}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

function addFooter(
  doc: InstanceType<typeof import('jspdf').jsPDF>,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  pageNum: number
): void {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'AccessibilityChecker.org  |  ACE™ Sitemap Page Classifier  |  Internal Tool',
    margin, pageHeight - 9
  )
  doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 9, { align: 'right' })
}
