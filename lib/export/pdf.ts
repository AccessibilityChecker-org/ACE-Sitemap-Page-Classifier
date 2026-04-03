// 'use client' - PDF generation is client-side only
import type { AnalysisResult, PricingRecommendation, QuoteCalculation, QuoteBuilderState } from '@/types'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export async function generatePDFQuote(
  analysis: AnalysisResult,
  recommendation: PricingRecommendation,
  quote: QuoteCalculation,
  quoteState: QuoteBuilderState
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // Color palette
  const GREEN = [22, 163, 74] as [number, number, number]
  const DARK_GREEN = [15, 107, 47] as [number, number, number]
  const LIGHT_GREEN = [240, 253, 244] as [number, number, number]
  const GRAY_100 = [243, 244, 246] as [number, number, number]
  const GRAY_700 = [55, 65, 81] as [number, number, number]
  const WHITE = [255, 255, 255] as [number, number, number]
  const AMBER_50 = [255, 251, 235] as [number, number, number]
  const AMBER_600 = [217, 119, 6] as [number, number, number]

  // ─── PAGE 1 ────────────────────────────────────────────────────────────────

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

  // Domain / date info
  let y = 35
  doc.setTextColor(...GRAY_700)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`${analysis.domain}`, margin, y)

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

  // Stats in a row
  const stats = [
    { label: 'Raw Pages', value: analysis.rawPageCount.toLocaleString() },
    { label: 'Template Types', value: analysis.templateTypesCount.toString() },
    { label: 'Content Pages', value: analysis.contentPagesCount.toLocaleString() },
    { label: 'Unique Pages', value: analysis.uniquePagesCount.toString() },
    { label: 'Dynamic Pages', value: analysis.dynamicPagesCount.toString() },
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
  autoTable(doc, {
    startY: y,
    head: [['Category', 'Type', 'Raw Count', 'Weighted', '% of Site']],
    body: analysis.categories.map((cat) => [
      cat.category,
      cat.typeLabel,
      cat.rawCount.toLocaleString(),
      cat.weightedCount.toLocaleString(),
      `${cat.percentOfSite}%`,
    ]),
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
    alternateRowStyles: {
      fillColor: GRAY_100,
    },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 56 },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  // Add page footer
  addFooter(doc, pageWidth, pageHeight, margin, 1)

  // ─── PAGE 2 ────────────────────────────────────────────────────────────────
  doc.addPage()

  // Header bar (repeated)
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, pageWidth, 16, 'F')
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('ACE™ Sitemap Page Classifier — Quote Report (continued)', margin, 10)

  y = 24

  // Recommended Tier
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
      pageWidth - margin - 4,
      y + 22,
      { align: 'right' }
    )

    // Weight reduction info
    doc.setTextColor(...DARK_GREEN)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(
      `Weight Reduction: ${recommendation.weightReductionPercent}% fewer effective pages vs. raw count`,
      margin + 6,
      y + 30
    )
  }

  y += 44

  // Savings Comparison box
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
      margin + 4,
      y + 16
    )
    doc.setTextColor([22, 101, 52] as unknown as string)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `Client saves ${fmt(recommendation.annualSavings)}/yr with weighted pricing`,
      margin + 4,
      y + 23
    )
  }

  y += 36

  // Quote Totals table
  doc.setTextColor(...GRAY_700)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Quote Summary', margin, y)

  y += 5

  const quotRows: [string, string][] = [
    ['Base Monthly', fmt(quote.baseMonthly) + '/mo'],
  ]
  if (quote.extraDomainCost > 0) quotRows.push(['Extra Domains', fmt(quote.extraDomainCost) + '/mo'])
  if (quote.dedicatedTeamCost > 0) quotRows.push(['Dedicated Team Upgrade', fmt(quote.dedicatedTeamCost) + '/mo'])
  quotRows.push(['Monthly Total', fmt(quote.monthlyTotal) + '/mo'])
  quotRows.push(['Annual Total', fmt(quote.annualTotal) + '/yr'])
  if (quote.oneTimePdfCost > 0) quotRows.push(['Extra PDF Pages (one-time)', fmt(quote.oneTimePdfCost)])
  if (quote.oneTimeVpatCost > 0) quotRows.push(['Additional VPATs (one-time)', fmt(quote.oneTimeVpatCost)])
  if (quote.totalOneTime > 0) quotRows.push(['Year 1 Total', fmt(quote.yearOneTotal)])

  autoTable(doc, {
    startY: y,
    body: quotRows,
    theme: 'plain',
    bodyStyles: {
      fontSize: 9,
      textColor: GRAY_700,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'normal' },
      1: { cellWidth: contentWidth - 80, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (
        data.section === 'body' &&
        (data.row.raw as string[])[0] === 'Monthly Total' ||
        (data.row.raw as string[])[0] === 'Annual Total' ||
        (data.row.raw as string[])[0] === 'Year 1 Total'
      ) {
        data.cell.styles.fillColor = LIGHT_GREEN
        data.cell.styles.textColor = DARK_GREEN
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: margin, right: margin },
  })

  // Notes
  if (quoteState.notes) {
    const currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || y + 40
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...GRAY_700)
    doc.text('Notes', margin, currentY + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const splitNotes = doc.splitTextToSize(quoteState.notes, contentWidth)
    doc.text(splitNotes, margin, currentY + 17)
  }

  addFooter(doc, pageWidth, pageHeight, margin, 2)

  // Download
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
  doc.text('AccessibilityChecker.org  |  ACE™ Sitemap Page Classifier  |  Internal Tool', margin, pageHeight - 9)
  doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 9, { align: 'right' })
}
