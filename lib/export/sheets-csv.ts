/**
 * Generates a CSV file formatted to match the ACE™ Proposal Generator Google Sheet.
 *
 * The Apps Script's readInputs() function reads label→value pairs from the sheet.
 * This CSV uses the exact same label names so the importFromACECsv() function in
 * appsscript_google.js can auto-fill the form with one click.
 */
import type { AnalysisResult, QuoteBuilderState } from '@/types'

function csvRow(field: string, value: string | number): string {
  const f = String(field)
  const v = String(value ?? '')
  // Wrap in quotes if the value contains commas, quotes, or newlines
  const escapedV = v.includes(',') || v.includes('"') || v.includes('\n')
    ? `"${v.replace(/"/g, '""')}"`
    : v
  return `${f},${escapedV}`
}

export function generateSheetsCsv(
  analysis: AnalysisResult,
  quoteState: QuoteBuilderState
): string {
  const rows: string[] = []

  // Header
  rows.push('Field,Value')
  rows.push(csvRow('Sales Rep Name',    quoteState.salesRep    || ''))
  rows.push(csvRow('Sales Rep Email',   quoteState.salesEmail  || ''))
  rows.push(csvRow('Company Name',      quoteState.clientCompany || analysis.domain))
  rows.push(csvRow('Contact Person',    quoteState.clientContact || ''))
  rows.push(csvRow('Contact Email',     quoteState.clientEmail   || ''))
  rows.push(csvRow('Contact Phone',     quoteState.clientPhone   || ''))
  rows.push(csvRow('Website URL',       quoteState.clientWebsite || `https://${analysis.domain}`))
  rows.push(csvRow('Plan Type',         'Managed Accessibility'))
  rows.push(csvRow('Billing Cycle',     quoteState.billingCycle === 'annual' ? 'Annual' : 'Monthly'))
  // Use the weighted page count from the analysis (the key output of the tool)
  rows.push(csvRow('Number of Pages',   analysis.weightedPageCount))
  rows.push(csvRow('Number of Domains', 1 + (quoteState.extraDomains ?? 0)))
  rows.push(csvRow('Dedicated Team Upgrade', quoteState.dedicatedTeam ? 'Yes' : 'No'))
  rows.push(csvRow('Extra PDF Pages',   quoteState.extraPdfPages ?? 0))
  rows.push(csvRow('Additional VPATs',  quoteState.additionalVpats ?? 0))
  rows.push(csvRow('Estimated Start Date',          quoteState.estimatedStart        || ''))
  rows.push(csvRow('Initial Remediation Timeline',  quoteState.remediationTimeline   || '4-8 weeks'))
  rows.push(csvRow('Contract Duration',             quoteState.contractDuration      || '12 months'))
  rows.push(csvRow('Quote Valid Until',              quoteState.quoteValidUntil       || ''))
  rows.push(csvRow('Custom Notes',                   quoteState.notes                 || ''))
  rows.push(csvRow('Special Discount (%)',           quoteState.discount ?? 0))

  return rows.join('\n')
}

export function downloadSheetsCsv(
  analysis: AnalysisResult,
  quoteState: QuoteBuilderState
): void {
  const csv = generateSheetsCsv(analysis, quoteState)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const clientName = (quoteState.clientCompany || analysis.domain)
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .slice(0, 30)
  a.download = `ace-proposal-data-${clientName}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
