'use client'

import { useState } from 'react'
import { Download, Copy, FileText, Check } from 'lucide-react'
import type { AnalysisResult, PricingRecommendation, QuoteCalculation, QuoteBuilderState } from '@/types'
import { downloadCsv } from '@/lib/export/csv'
import { generateQuoteSummary } from '@/lib/export/quote'

interface Props {
  analysis: AnalysisResult
  recommendation: PricingRecommendation
  quoteCalc: QuoteCalculation
  quoteState: QuoteBuilderState
}

export default function ExportSection({ analysis, recommendation, quoteCalc, quoteState }: Props) {
  const [copied, setCopied] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const handleCsvExport = () => {
    downloadCsv(analysis)
  }

  const handleCopyQuote = async () => {
    const summary = generateQuoteSummary(analysis, recommendation, quoteCalc, quoteState)
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = summary
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handlePdfExport = async () => {
    setPdfGenerating(true)
    setPdfError(null)
    try {
      const { generatePDFQuote } = await import('@/lib/export/pdf')
      await generatePDFQuote(analysis, recommendation, quoteCalc, quoteState)
    } catch (err) {
      console.error('PDF generation failed:', err)
      setPdfError(err instanceof Error ? err.message : 'PDF generation failed. Please try again.')
    } finally {
      setPdfGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
          8
        </div>
        <h2 className="text-gray-900 font-semibold text-base">Export</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {/* CSV Export */}
        <button
          onClick={handleCsvExport}
          className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
        >
          <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
            <Download size={18} className="text-green-700" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Export CSV</p>
            <p className="text-xs text-gray-400 mt-0.5">Full URL list + analysis data</p>
          </div>
        </button>

        {/* Copy Quote Summary */}
        <button
          onClick={handleCopyQuote}
          className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors group ${
            copied
              ? 'bg-green-50 border-green-200'
              : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            copied ? 'bg-green-200' : 'bg-blue-100 group-hover:bg-blue-200'
          }`}>
            {copied ? (
              <Check size={18} className="text-green-700" />
            ) : (
              <Copy size={18} className="text-blue-700" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {copied ? 'Copied!' : 'Copy Quote Summary'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Paste-ready text summary</p>
          </div>
        </button>

        {/* PDF Export */}
        <button
          onClick={handlePdfExport}
          disabled={pdfGenerating}
          className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
            {pdfGenerating ? (
              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            ) : (
              <FileText size={18} className="text-red-700" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {pdfGenerating ? 'Generating...' : 'Generate PDF Quote'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Professional PDF report</p>
          </div>
        </button>
      </div>

      {pdfError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-700">PDF generation failed</p>
            <p className="text-xs text-red-600 mt-0.5">{pdfError}</p>
          </div>
          <button onClick={() => setPdfError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500">
          <span className="font-medium">CSV</span> includes all classified URLs with page type and weighted values.{' '}
          <span className="font-medium">Quote Summary</span> is formatted text for pasting into email or CRM.{' '}
          <span className="font-medium">PDF</span> is a branded 2-page quote report for client delivery.
        </p>
      </div>
    </div>
  )
}
