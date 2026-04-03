import { NextRequest } from 'next/server'
import type { PageWeights, AnalysisResult } from '@/types'
import { fetchSitemapUrls } from '@/lib/sitemap/fetcher'
import { parseSitemapXml, parseUrlList } from '@/lib/sitemap/parser'
import { classifyUrls, computeAnalysisSummary } from '@/lib/classification/classifier'
import { detectPlatform } from '@/lib/platform-detection/detector'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface AnalyzeRequestBody {
  type: 'url' | 'xml' | 'urls'
  sitemapUrl?: string
  xmlContent?: string
  urlList?: string
  weights: PageWeights
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Controller may already be closed
        }
      }

      try {
        const body: AnalyzeRequestBody = await req.json()
        const { type, weights } = body

        if (!weights) {
          send({ type: 'error', message: 'Missing weights in request' })
          controller.close()
          return
        }

        let urls: string[] = []
        let assetUrlsFiltered = 0
        let domain = 'unknown'
        // Source sitemap map: url → sitemap label (only populated for URL fetch mode)
        let sourceSitemapMap: Map<string, string> | undefined

        if (type === 'url') {
          if (!body.sitemapUrl) {
            send({ type: 'error', message: 'Missing sitemapUrl' })
            controller.close()
            return
          }

          domain = getDomain(body.sitemapUrl)

          const result = await fetchSitemapUrls(
            body.sitemapUrl,
            (step: string, detail: string, percent: number) => {
              send({ type: 'progress', step, detail, percent })
            }
          )

          urls = result.urls
          assetUrlsFiltered = result.assetUrlsFiltered
          sourceSitemapMap = result.urlSourceMap

        } else if (type === 'xml') {
          if (!body.xmlContent) {
            send({ type: 'error', message: 'Missing xmlContent' })
            controller.close()
            return
          }

          send({ type: 'progress', step: 'Parsing XML', detail: 'Analyzing XML structure', percent: 20 })
          const parsed = parseSitemapXml(body.xmlContent)
          urls = parsed.urls
          assetUrlsFiltered = parsed.assetUrlsFiltered

          if (parsed.type === 'sitemapindex') {
            send({
              type: 'progress',
              step: 'Sitemap Index',
              detail: `Found ${parsed.sitemapUrls.length} child sitemaps — use URL mode to fetch them`,
              percent: 40,
            })
            domain = parsed.sitemapUrls[0] ? getDomain(parsed.sitemapUrls[0]) : 'unknown'
          } else {
            domain = urls[0] ? getDomain(urls[0]) : 'unknown'
          }

        } else if (type === 'urls') {
          if (!body.urlList) {
            send({ type: 'error', message: 'Missing urlList' })
            controller.close()
            return
          }

          send({ type: 'progress', step: 'Parsing URL list', detail: 'Processing pasted URLs', percent: 20 })
          urls = parseUrlList(body.urlList)
          domain = urls[0] ? getDomain(urls[0]) : 'unknown'

        } else {
          send({ type: 'error', message: `Unknown input type: ${type}` })
          controller.close()
          return
        }

        if (urls.length === 0) {
          send({
            type: 'error',
            message: 'No page URLs found. Please check your sitemap or URL list.',
          })
          controller.close()
          return
        }

        send({
          type: 'progress',
          step: 'Detecting platform',
          detail: `Analysing ${urls.length} URLs for platform signals`,
          percent: 70,
        })
        const { platform, confidence: platformConfidence } = detectPlatform(urls)

        send({
          type: 'progress',
          step: 'Classifying pages',
          detail: `Classifying ${urls.length} URLs into categories`,
          percent: 80,
        })
        // Pass source sitemap map so the classifier can use child sitemap labels
        // as an additional category signal (Layer 1 of the 6-layer engine).
        const { classified, categories } = classifyUrls(urls, weights, sourceSitemapMap)

        send({
          type: 'progress',
          step: 'Calculating weights',
          detail: 'Computing weighted page counts',
          percent: 90,
        })
        const summary = computeAnalysisSummary(classified)

        const result: AnalysisResult = {
          domain,
          platform,
          platformConfidence,
          rawPageCount: urls.length,
          assetUrlsFiltered,
          ...summary,
          categories,
          allClassifiedUrls: classified,
          weights,
          analyzedAt: new Date().toISOString(),
        }

        send({ type: 'progress', step: 'Complete', detail: 'Analysis finished', percent: 100 })
        send({ type: 'complete', result })

      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        try {
          send({ type: 'error', message: `Analysis failed: ${message}` })
        } catch {
          // Ignore if controller is already closed
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
