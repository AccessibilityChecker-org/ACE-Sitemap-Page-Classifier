'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  AnalysisResult,
  AnalysisProgress,
  PageWeights,
  QuoteBuilderState,
  QuoteCalculation,
  PricingRecommendation,
  SubdomainEntry,
} from '@/types'
import { DEFAULT_WEIGHTS } from '@/config/pricing'
import { getPricingRecommendation, calculateQuote } from '@/lib/pricing/engine'
import { demoAnalysis } from '@/lib/demo/demoData'

import LoadSitemap from '@/components/LoadSitemap'
import PageWeightsEditor from '@/components/PageWeights'
import LoadingState from '@/components/LoadingState'
import AnalysisOverview from '@/components/AnalysisOverview'
import PageCategories from '@/components/PageCategories'
import RecommendedTier from '@/components/RecommendedTier'
import QuoteBuilder from '@/components/QuoteBuilder'
import URLBreakdown from '@/components/URLBreakdown'
import ExportSection from '@/components/ExportSection'
import SubdomainManager from '@/components/SubdomainManager'
import ExecutiveSummary from '@/components/ExecutiveSummary'

const DEFAULT_PROGRESS: AnalysisProgress = {
  step: 'Starting...',
  detail: 'Initializing',
  percent: 0,
  isComplete: false,
  isError: false,
}

function getDefaultQuoteState(): QuoteBuilderState {
  return {
    basePlan: null,
    extraDomains: 0,
    dedicatedTeam: false,
    extraPdfPages: 0,
    additionalVpats: 0,
    notes: '',
  }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

/** Stream an analysis from the API and return the completed AnalysisResult */
async function streamAnalysis(
  payload: {
    type: 'url' | 'xml' | 'urls'
    sitemapUrl?: string
    weights: PageWeights
  },
  onProgress: (step: string, detail: string, percent: number) => void
): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.body) throw new Error('No response body from server')

  const reader  = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'progress') {
          onProgress(event.step, event.detail, event.percent)
        } else if (event.type === 'complete') {
          return event.result as AnalysisResult
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      } catch (parseErr) {
        // Ignore malformed individual SSE frames
        if (parseErr instanceof SyntaxError) continue
        throw parseErr
      }
    }
  }
  throw new Error('Stream ended without a complete result')
}

export default function HomePage() {
  const [weights, setWeights]               = useState<PageWeights>(DEFAULT_WEIGHTS)
  const [isLoading, setIsLoading]           = useState(false)
  const [progress, setProgress]             = useState<AnalysisProgress>(DEFAULT_PROGRESS)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [subdomains, setSubdomains]         = useState<SubdomainEntry[]>([])
  const [quoteState, setQuoteState]         = useState<QuoteBuilderState>(getDefaultQuoteState())

  // Track running subdomain scans so we can cancel them on page reset
  const subdomainAbortRefs = useRef<Map<string, AbortController>>(new Map())

  // ── Derived: combined weighted/raw counts ──────────────────────────────────
  const includedSubdomains = subdomains.filter((s) => s.included && s.analysis)
  const extraWeighted = includedSubdomains.reduce((n, s) => n + (s.analysis?.weightedPageCount ?? 0), 0)
  const extraRaw      = includedSubdomains.reduce((n, s) => n + (s.analysis?.rawPageCount ?? 0), 0)
  const combinedWeightedCount = (analysisResult?.weightedPageCount ?? 0) + extraWeighted
  const combinedRawCount      = (analysisResult?.rawPageCount      ?? 0) + extraRaw

  // ── Derived: recommendation based on COMBINED count ────────────────────────
  const recommendation: PricingRecommendation | null = analysisResult
    ? getPricingRecommendation(combinedWeightedCount, combinedRawCount)
    : null

  const applyAnalysisResult = useCallback(
    (result: AnalysisResult) => {
      setAnalysisResult(result)
      // Reset subdomains when a new primary analysis runs
      setSubdomains([])
      subdomainAbortRefs.current.clear()
      const rec = getPricingRecommendation(result.weightedPageCount, result.rawPageCount)
      setQuoteState((prev) => ({ ...prev, basePlan: rec.weightedPlan }))
    },
    []
  )

  // Keep quoteState.basePlan in sync whenever the recommendation changes
  // (e.g. when subdomains are toggled in/out)
  const syncedQuoteState: QuoteBuilderState = {
    ...quoteState,
    basePlan: recommendation?.weightedPlan ?? quoteState.basePlan,
  }

  // ── Main domain analysis ───────────────────────────────────────────────────
  const handleAnalyze = useCallback(
    async (payload: {
      type: 'url' | 'xml' | 'urls'
      sitemapUrl?: string
      xmlContent?: string
      urlList?: string
      weights: PageWeights
    }) => {
      setIsLoading(true)
      setAnalysisResult(null)
      setSubdomains([])
      setProgress({ ...DEFAULT_PROGRESS, step: 'Starting analysis…', detail: 'Connecting to server', percent: 2 })

      try {
        const result = await streamAnalysis(
          payload as { type: 'url' | 'xml' | 'urls'; sitemapUrl?: string; weights: PageWeights },
          (step, detail, percent) => setProgress({ step, detail, percent, isComplete: false, isError: false })
        )
        setProgress({ step: 'Complete', detail: 'Analysis finished', percent: 100, isComplete: true, isError: false })
        applyAnalysisResult(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setProgress({ step: 'Error', detail: message, percent: 0, isComplete: false, isError: true, errorMessage: message })
      } finally {
        setIsLoading(false)
      }
    },
    [applyAnalysisResult]
  )

  const handleLoadDemo = useCallback(() => {
    setIsLoading(true)
    setAnalysisResult(null)
    setSubdomains([])
    const steps = [
      { step: 'Fetching sitemap', detail: 'Downloading gemstoneking.com/sitemap.xml', percent: 10 },
      { step: 'Sitemap index detected', detail: 'Found 4 sub-sitemaps', percent: 20 },
      { step: 'Fetching sub-sitemaps', detail: '[1/4] sitemap_products_1', percent: 40 },
      { step: 'Fetching sub-sitemaps', detail: '[2/4] sitemap_collections_1', percent: 55 },
      { step: 'Detecting platform', detail: 'Analysing 6,387 URLs', percent: 75 },
      { step: 'Classifying pages', detail: 'Classifying 6,387 URLs into categories', percent: 85 },
      { step: 'Calculating weights', detail: 'Computing weighted page counts', percent: 95 },
      { step: 'Complete', detail: 'Analysis finished — 6,387 pages classified', percent: 100 },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) {
        setProgress({ ...steps[i], isComplete: false, isError: false })
        i++
      } else {
        clearInterval(interval)
        applyAnalysisResult({ ...demoAnalysis, weights })
        setIsLoading(false)
      }
    }, 220)
  }, [weights, applyAnalysisResult])

  // ── Subdomain management ──────────────────────────────────────────────────

  const handleAddSubdomain = useCallback(async (sitemapUrl: string) => {
    const id    = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const label = getDomain(sitemapUrl)

    const newEntry: SubdomainEntry = {
      id,
      sitemapUrl,
      label,
      status:   'scanning',
      included: true,     // included by default — user can toggle off
      analysis: null,
      progress: 0,
      progressStep: 'Starting…',
    }

    setSubdomains((prev) => [...prev, newEntry])

    try {
      const result = await streamAnalysis(
        { type: 'url', sitemapUrl, weights },
        (step, _detail, percent) => {
          setSubdomains((prev) =>
            prev.map((s) =>
              s.id === id ? { ...s, progress: percent, progressStep: step } : s
            )
          )
        }
      )
      setSubdomains((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: 'complete', analysis: result, progress: 100, progressStep: 'Complete' }
            : s
        )
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setSubdomains((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: 'error', errorMessage: message } : s
        )
      )
    }
  }, [weights])

  const handleRemoveSubdomain = useCallback((id: string) => {
    subdomainAbortRefs.current.get(id)?.abort()
    subdomainAbortRefs.current.delete(id)
    setSubdomains((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleToggleSubdomainIncluded = useCallback((id: string) => {
    setSubdomains((prev) =>
      prev.map((s) => s.id === id ? { ...s, included: !s.included } : s)
    )
  }, [])

  // ── Quote calc ────────────────────────────────────────────────────────────
  const quoteCalc: QuoteCalculation = recommendation
    ? calculateQuote(syncedQuoteState)
    : {
        baseMonthly: 0, extraDomainCost: 0, dedicatedTeamCost: 0,
        monthlyTotal: 0, annualTotal: 0,
        oneTimePdfCost: 0, oneTimeVpatCost: 0, totalOneTime: 0, yearOneTotal: 0,
      }

  const showResults = analysisResult && recommendation && !isLoading

  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-24">
      {/* ───────── Hero ───────── */}
      <section className="ace-hero ace-reveal">
        <div className="ace-hero-grid">
          <div>
            <div className="ace-display-meta mb-5">
              <span>Edition 01</span>
              <span className="ace-tick" aria-hidden />
              <span>Compendium for pre-sales engineering</span>
            </div>
            <h1 className="ace-display">
              The sitemap,<br />
              classified by <em>form</em> &amp; <em>function</em>.
            </h1>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <p className="text-ink-muted text-[15px] leading-[1.55] max-w-sm md:text-right">
              A page-by-page instrument that separates templates from content,
              surfaces the shape of a site, and composes managed-accessibility
              proposals worth pressing into a PDF.
            </p>
            <div className="flex gap-2 items-center text-[11px] font-mono uppercase tracking-[0.22em] text-ink-soft">
              <span>01 Load</span>
              <span className="ace-tick" aria-hidden />
              <span>02 Weight</span>
              <span className="ace-tick" aria-hidden />
              <span>03 Classify</span>
              <span className="ace-tick" aria-hidden />
              <span>04 Quote</span>
            </div>
          </div>
        </div>
        <div className="mt-10 h-[2px] bg-[color:var(--rule-strong)]" aria-hidden />
      </section>

      <div className="space-y-10 pt-6">
        {/* Step 1: Load Sitemap */}
        <div className="ace-reveal" style={{ animationDelay: '60ms' }}>
          <LoadSitemap weights={weights} onAnalyze={handleAnalyze} onLoadDemo={handleLoadDemo} isLoading={isLoading} />
        </div>

        {/* Step 2: Page Weights */}
        <div className="ace-reveal" style={{ animationDelay: '120ms' }}>
          <PageWeightsEditor weights={weights} onChange={setWeights} />
        </div>

        {/* Loading / Error state */}
        {(isLoading || (!isLoading && progress.isError)) && <LoadingState progress={progress} />}

        {/* Results */}
        {showResults && (
          <>
            <div className="ace-reveal"><AnalysisOverview analysis={analysisResult} /></div>
            <div className="ace-reveal"><PageCategories analysis={analysisResult} /></div>
            <div className="ace-reveal">
              <SubdomainManager
                subdomains={subdomains}
                weights={weights}
                mainDomain={analysisResult.domain}
                onAdd={handleAddSubdomain}
                onRemove={handleRemoveSubdomain}
                onToggleIncluded={handleToggleSubdomainIncluded}
                combinedWeightedCount={combinedWeightedCount}
                combinedRawCount={combinedRawCount}
              />
            </div>
            <div className="ace-reveal"><RecommendedTier analysis={analysisResult} recommendation={recommendation} /></div>
            <div className="ace-reveal">
              <QuoteBuilder
                quoteState={syncedQuoteState}
                quoteCalc={quoteCalc}
                recommendation={recommendation}
                onChange={setQuoteState}
              />
            </div>
            <div className="ace-reveal"><URLBreakdown analysis={analysisResult} /></div>
            <div className="ace-reveal">
              <ExecutiveSummary
                rawPageCount={combinedRawCount}
                weightedPageCount={combinedWeightedCount}
                recommendation={recommendation}
              />
            </div>
            <div className="ace-reveal">
              <ExportSection
                analysis={analysisResult}
                recommendation={recommendation}
                quoteCalc={quoteCalc}
                quoteState={syncedQuoteState}
              />
            </div>
          </>
        )}

        {/* Empty state */}
        {!analysisResult && !isLoading && !progress.isError && (
          <div className="ace-panel ace-panel--inset text-center py-16">
            <div className="ace-display-meta mb-3">Awaiting input</div>
            <p className="font-display italic text-[28px] leading-tight text-ink max-w-md mx-auto">
              Paste a sitemap above, or load the demo to see a full proposal take shape.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
