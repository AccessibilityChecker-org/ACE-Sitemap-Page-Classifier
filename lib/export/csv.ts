import type { AnalysisResult, CategoryGroup } from '@/types'

function escapeCsvValue(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function row(values: (string | number)[]): string {
  return values.map(escapeCsvValue).join(',')
}

export function generateCsv(analysis: AnalysisResult): string {
  const lines: string[] = []

  // Header metadata
  lines.push(row(['ACE™ Sitemap Page Classifier Export']))
  lines.push(row(['Domain', analysis.domain]))
  lines.push(row(['Platform', analysis.platform]))
  lines.push(row(['Analyzed At', analysis.analyzedAt]))
  lines.push('')

  // Summary
  lines.push(row(['SUMMARY']))
  lines.push(row(['Metric', 'Value']))
  lines.push(row(['Raw Pages', analysis.rawPageCount]))
  lines.push(row(['Assets Filtered', analysis.assetUrlsFiltered]))
  lines.push(row(['Template Types', analysis.templateTypesCount]))
  lines.push(row(['Content Pages', analysis.contentPagesCount]))
  lines.push(row(['Unique Pages', analysis.uniquePagesCount]))
  lines.push(row(['Dynamic Pages', analysis.dynamicPagesCount]))
  lines.push(row(['Weighted Pages', analysis.weightedPageCount]))
  lines.push('')

  // Weights used
  lines.push(row(['WEIGHTS USED']))
  lines.push(row(['Type', 'Weight']))
  lines.push(row(['Template', analysis.weights.template]))
  lines.push(row(['Unique', analysis.weights.unique]))
  lines.push(row(['Content', analysis.weights.content]))
  lines.push(row(['Dynamic', analysis.weights.dynamic]))
  lines.push('')

  // Category breakdown
  lines.push(row(['PAGE CATEGORIES BREAKDOWN']))
  lines.push(
    row(['Category', 'Type', 'Raw Count', 'Weighted Count', '% of Site', 'Templates', 'Content', 'Unique', 'Dynamic'])
  )

  for (const cat of analysis.categories) {
    lines.push(
      row([
        cat.category,
        cat.typeLabel,
        cat.rawCount,
        cat.weightedCount,
        cat.percentOfSite,
        cat.templateCount,
        cat.contentCount,
        cat.uniqueCount,
        cat.dynamicCount,
      ])
    )
  }
  lines.push('')

  // Full URL list
  if (analysis.allClassifiedUrls.length > 0) {
    lines.push(row(['FULL URL CLASSIFICATION']))
    lines.push(row(['URL', 'Category', 'Page Type', 'Template Cluster', 'Weighted Value', 'Notes']))

    for (const cu of analysis.allClassifiedUrls) {
      lines.push(
        row([
          cu.url,
          cu.category,
          cu.pageType,
          cu.templateClusterId || '',
          cu.weightedValue,
          cu.notes,
        ])
      )
    }
  }

  return lines.join('\n')
}

export function downloadCsv(analysis: AnalysisResult): void {
  const csv = generateCsv(analysis)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ace-analysis-${analysis.domain}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
