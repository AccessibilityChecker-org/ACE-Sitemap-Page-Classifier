'use client'

import { useState, useCallback } from 'react'
import type {
  AnalysisResult,
  AnalysisProgress,
  PageWeights,
  QuoteBuilderState,
  QuoteCalculation,
  PricingRecommendation,
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

export default function HomePage() {
  const [weights, setWeights] = useState<PageWeights>(DEFAULT_WEIGHTS)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<AnalysisProgress>(DEFAULT_PROGRESS)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [recommendation, setRecommendation] = useState<PricingRecommendation | null>(null)
  const [quoteState, setQuoteState] = useState<QuoteBuilderState>(getDefaultQuoteState())

  const applyAnalysisResult = useCallback(
    (result: AnalysisResult) => {
      const rec = getPricingRecommendation(result.weightedPageCount, result.rawPageCount)
      setAnalysisResult(result)
      setRecommendation(rec)
      setQuoteState((prev) => ({
        ...prev,
        basePlan: rec.weightedPlan,
      }))
    },
    []
  )

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
      setRecommendation(null)
      setProgress({ ...DEFAULT_PROGRESS, step: 'Starting analysis...', detail: 'Connecting to server', percent: 2 })

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6))

                if (event.type === 'progress') {
                  setProgress({
                    step: event.step,
                    detail: event.detail,
                    percent: event.percent,
                    isComplete: false,
                    isError: false,
                  })
                } else if (event.type === 'complete') {
                  setProgress({
                    step: 'Complete',
                    detail: 'Analysis finished',
                    percent: 100,
                    isComplete: true,
                    isError: false,
                  })
                  applyAnalysisResult(event.result as AnalysisResult)
                  setIsLoading(false)
                } else if (event.type === 'error') {
                  setProgress({
                    step: 'Error',
                    detail: event.message,
                    percent: 0,
                    isComplete: false,
                    isError: true,
                    errorMessage: event.message,
                  })
                  setIsLoading(false)
                }
              } catch {
                // Ignore parse errors for individual events
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setProgress({
          step: 'Error',
          detail: message,
          percent: 0,
          isComplete: false,
          isError: true,
          errorMessage: message,
        })
        setIsLoading(false)
      }
    },
    [applyAnalysisResult]
  )

  const handleLoadDemo = useCallback(() => {
    setIsLoading(true)
    setAnalysisResult(null)
    setRecommendation(null)

    // Simulate realistic loading steps
    const steps = [
      { step: 'Fetching sitemap', detail: 'Downloading gemstoneking.com/sitemap.xml', percent: 10 },
      { step: 'Sitemap index detected', detail: 'Found 4 sub-sitemaps (products, collections, pages, blogs)', percent: 20 },
      { step: 'Fetching sub-sitemaps', detail: 'Fetching sub-sitemap 1/4: /sitemap_products_1.xml', percent: 35 },
      { step: 'Fetching sub-sitemaps', detail: 'Fetching sub-sitemap 2/4: /sitemap_collections_1.xml', percent: 50 },
      { step: 'Fetching sub-sitemaps', detail: 'Fetching sub-sitemap 3/4: /sitemap_pages_1.xml', percent: 65 },
      { step: 'Detecting platform', detail: 'Analyzing 6,387 URLs for platform signals', percent: 75 },
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
        // Apply demo data with the current weights
        const demoWithWeights: AnalysisResult = { ...demoAnalysis, weights }
        applyAnalysisResult(demoWithWeights)
        setIsLoading(false)
      }
    }, 220)
  }, [weights, applyAnalysisResult])

  const handleWeightsChange = useCallback(
    (newWeights: PageWeights) => {
      setWeights(newWeights)
    },
    []
  )

  const handleQuoteStateChange = useCallback((newState: QuoteBuilderState) => {
    setQuoteState(newState)
  }, [])

  const quoteCalc: QuoteCalculation = recommendation
    ? calculateQuote(quoteState)
    : {
        baseMonthly: 0,
        extraDomainCost: 0,
        dedicatedTeamCost: 0,
        monthlyTotal: 0,
        annualTotal: 0,
        oneTimePdfCost: 0,
        oneTimeVpatCost: 0,
        totalOneTime: 0,
        yearOneTotal: 0,
      }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hero intro */}
      <div className="text-center pb-2">
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          ACE™ Sitemap Page Classifier
        </h1>
        <p className="text-gray-500 text-sm max-w-xl mx-auto">
          Scan any sitemap, classify pages, detect template repetition, apply weighted pricing,
          and generate professional accessibility service quotes.
        </p>
      </div>

      {/* Step 1: Load Sitemap */}
      <LoadSitemap
        weights={weights}
        onAnalyze={handleAnalyze}
        onLoadDemo={handleLoadDemo}
        isLoading={isLoading}
      />

      {/* Step 2: Page Weights */}
      <PageWeightsEditor weights={weights} onChange={handleWeightsChange} />

      {/* Loading State */}
      {isLoading && <LoadingState progress={progress} />}

      {/* Error State */}
      {!isLoading && progress.isError && <LoadingState progress={progress} />}

      {/* Results */}
      {analysisResult && recommendation && !isLoading && (
        <>
          {/* Step 3: Analysis Overview */}
          <AnalysisOverview analysis={analysisResult} />

          {/* Step 4: Page Categories */}
          <PageCategories analysis={analysisResult} />

          {/* Step 5: Recommended Tier */}
          <RecommendedTier analysis={analysisResult} recommendation={recommendation} />

          {/* Step 6: Quote Builder */}
          <QuoteBuilder
            quoteState={quoteState}
            quoteCalc={quoteCalc}
            recommendation={recommendation}
            onChange={handleQuoteStateChange}
          />

          {/* Step 7: URL Breakdown */}
          <URLBreakdown analysis={analysisResult} />

          {/* Step 8: Export */}
          <ExportSection
            analysis={analysisResult}
            recommendation={recommendation}
            quoteCalc={quoteCalc}
            quoteState={quoteState}
          />
        </>
      )}

      {/* Empty state prompt */}
      {!analysisResult && !isLoading && !progress.isError && (
        <div className="text-center py-16 text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-400">
            Enter a sitemap URL above or click the Demo button to see results
          </p>
        </div>
      )}
    </div>
  )
}
