'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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

const MAX_IMPORT_URLS = 10000

interface AceImportPayload {
  v: number
  source: string
  source_url?: string
  count?: number
  urls: string[]
  issued_at?: string
}

/** Decode a base64url-encoded JSON handoff payload. Returns null on any failure. */
function decodeAceImport(fragment: string): AceImportPayload | null {
  try {
    let b64 = fragment.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    const binary = atob(b64)
    // UTF-8 safe decode
    const json = decodeURIComponent(escape(binary))
    const parsed = JSON.parse(json)
    if (
      parsed &&
      parsed.v === 1 &&
      parsed.source === 'ace-sitemap-converter' &&
      Array.isArray(parsed.urls) &&
      parsed.urls.length > 0 &&
      parsed.urls.every((u: unknown) => typeof u === 'string')
    ) {
      return parsed as AceImportPayload
    }
    return null
  } catch (err) {
    console.warn('[ace-import] Failed to decode handoff payload:', err)
    return null
  }
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

  // Handoff from ace-sitemap-converter
  const [importedUrlList, setImportedUrlList] = useState<{ value: string; nonce: number } | null>(null)
  const [importNotice, setImportNotice]       = useState<{ count: number; source: string } | null>(null)
  const [importError, setImportError]         = useState<string | null>(null)
  const loadSitemapRef                        = useRef<HTMLDivElement | null>(null)

  // Track running subdomain scans so we can cancel them on page reset
  const subdomainAbortRefs = useRef<Map<string, AbortController>>(new Map())

  // ── Detect ace-sitemap-converter handoff on mount (hash fragment) ─────────
  useEffect(() => {
    const hash = window.location.hash
    const prefix = '#ace-import='
    if (!hash.startsWith(prefix)) return

    const payload = decodeAceImport(hash.slice(prefix.length))

    // Clear hash so refresh doesn't re-import
    history.replaceState(null, '', window.location.pathname + window.location.search)

    if (!payload) return

    if (payload.urls.length > MAX_IMPORT_URLS) {
      setImportError(
        `Import rejected: ${payload.urls.length.toLocaleString()} URLs exceeds the ${MAX_IMPORT_URLS.toLocaleString()}-URL limit.`,
      )
      return
    }

    setImportedUrlList({ value: payload.urls.join('\n'), nonce: Date.now() })
    setImportNotice({
      count: payload.count ?? payload.urls.length,
      source: payload.source,
    })

    // Smooth-scroll to Section 1 so the pasted list is visible
    requestAnimationFrame(() => {
      loadSitemapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

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
      {/* ───────── Hero: scanner diagnostic ───────── */}
      <section className="ace-hero ace-reveal">
        <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-3 mb-4 flex items-center gap-3">
          <span className="ace-caret">$&gt;</span>
          <span>ace-scanner</span>
          <span className="ace-tick" aria-hidden />
          <span>build.v1</span>
          <span className="ace-tick" aria-hidden />
          <span className="text-[color:var(--brand-deep)]">ready</span>
        </div>
        <h1 className="ace-hero-lead">
          Sitemap<span className="slash">//</span>scanner
          <br />
          for accessibility
          <br />
          <span className="text-[color:var(--brand)]">quotes.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.55] text-ink-2">
          Point it at any sitemap. It classifies every page, detects template
          repetition, applies weighted pricing, and composes a proposal. No
          guesswork, no crawling — just the map.
        </p>

        {/* Scan-band — 4-step pipeline */}
        <div className="ace-scanband mt-10">
          <div>
            <span>Stage 01</span>
            <strong>Load</strong>
          </div>
          <div>
            <span>Stage 02</span>
            <strong>Weight</strong>
          </div>
          <div>
            <span>Stage 03</span>
            <strong>Classify</strong>
          </div>
          <div>
            <span>Stage 04</span>
            <strong>Quote</strong>
          </div>
        </div>
      </section>

      <div className="space-y-10 pt-6">
        {/* Step 1: Load Sitemap */}
        <div ref={loadSitemapRef} className="ace-reveal" style={{ animationDelay: '60ms' }}>
          {importNotice && (
            <div
              role="status"
              aria-live="polite"
              className="ace-panel ace-panel--inset mb-4 flex items-start gap-4"
              style={{ borderColor: 'var(--brand)' }}
            >
              <div className="flex-1">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[color:var(--brand-deep)] mb-1 flex items-center gap-2">
                  <span aria-hidden>✓</span>
                  <span>URLs added from Sitemap Converter</span>
                </div>
                <p className="text-[14px] leading-[1.5] text-ink-2">
                  <strong>{importNotice.count.toLocaleString()}</strong> URLs imported from{' '}
                  <code className="font-mono text-[12px]">{importNotice.source}</code>. Review the
                  list below, then click <strong>FETCH &amp; ANALYZE</strong> to continue.
                </p>
              </div>
              <button
                onClick={() => setImportNotice(null)}
                className="ace-btn ace-btn--ghost"
                aria-label="Dismiss import notification"
              >
                Dismiss
              </button>
            </div>
          )}
          {importError && (
            <div
              role="alert"
              className="ace-panel ace-panel--inset mb-4 flex items-start gap-4"
              style={{ borderColor: '#c0392b' }}
            >
              <div className="flex-1">
                <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#c0392b] mb-1">
                  Import failed
                </div>
                <p className="text-[14px] leading-[1.5] text-ink-2">{importError}</p>
              </div>
              <button
                onClick={() => setImportError(null)}
                className="ace-btn ace-btn--ghost"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}
          <LoadSitemap
            weights={weights}
            onAnalyze={handleAnalyze}
            onLoadDemo={handleLoadDemo}
            isLoading={isLoading}
            importedUrlList={importedUrlList}
          />
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
            <div className="ace-reveal"><PageCategories analysis={analysisResult} recommendation={recommendation} /></div>
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
          <div className="ace-panel ace-panel--inset">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink-3 mb-2 flex items-center gap-2">
              <span className="ace-caret">$&gt;</span>
              <span>awaiting input</span>
              <span className="ace-dot ace-dot--cyan" aria-hidden />
            </div>
            <p className="font-mono text-[15px] text-ink-2 leading-relaxed">
              Paste a sitemap above, or run the demo to see the full pipeline execute.
              <span className="text-ink-4"> # no target locked</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
