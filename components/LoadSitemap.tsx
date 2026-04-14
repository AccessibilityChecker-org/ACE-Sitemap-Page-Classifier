'use client'

import { useState, useEffect } from 'react'
import { Globe, Code, List, Zap } from 'lucide-react'
import type { PageWeights } from '@/types'

interface Props {
  weights: PageWeights
  onAnalyze: (payload: {
    type: 'url' | 'xml' | 'urls'
    sitemapUrl?: string
    xmlContent?: string
    urlList?: string
    weights: PageWeights
  }) => void
  onLoadDemo: () => void
  isLoading: boolean
  /** When set (nonce changes), programmatically switch to PASTE URLS tab and fill textarea. */
  importedUrlList?: { value: string; nonce: number } | null
}

type Tab = 'url' | 'xml' | 'urls'

export default function LoadSitemap({ weights, onAnalyze, onLoadDemo, isLoading, importedUrlList }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('url')
  const [sitemapUrl, setSitemapUrl] = useState('')
  const [xmlContent, setXmlContent] = useState('')
  const [urlList, setUrlList] = useState('')

  // Apply external import (from ace-sitemap-converter handoff)
  useEffect(() => {
    if (importedUrlList && importedUrlList.value) {
      setActiveTab('urls')
      setUrlList(importedUrlList.value)
    }
  }, [importedUrlList?.nonce])

  const handleSubmit = () => {
    if (activeTab === 'url') {
      if (!sitemapUrl.trim()) return
      onAnalyze({ type: 'url', sitemapUrl: sitemapUrl.trim(), weights })
    } else if (activeTab === 'xml') {
      if (!xmlContent.trim()) return
      onAnalyze({ type: 'xml', xmlContent: xmlContent.trim(), weights })
    } else {
      if (!urlList.trim()) return
      onAnalyze({ type: 'urls', urlList: urlList.trim(), weights })
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'Sitemap URL', icon: <Globe size={14} /> },
    { id: 'xml', label: 'Paste XML', icon: <Code size={14} /> },
    { id: 'urls', label: 'Paste URLs', icon: <List size={14} /> },
  ]

  return (
    <div className="ace-panel">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-baseline gap-5">
          <div className="ace-num">1</div>
          <div className="flex flex-col gap-0.5">
            <span className="ace-section-kicker">Section 1</span>
            <h2 className="ace-title">Load Sitemap</h2>
          </div>
        </div>
        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="ace-btn ace-btn--ghost"
        >
          <Zap size={12} />
          Demo · Shopify Jewelry
        </button>
      </div>

      {/* Tabs — editorial underline tabs */}
      <div className="flex border-b-2 border-[color:var(--rule)] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="relative flex items-center gap-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors"
            style={{
              color: activeTab === tab.id ? 'var(--ink)' : 'var(--ink-soft)',
            }}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute left-0 right-0 -bottom-[2px] h-[2px]"
                style={{ background: 'var(--ink)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'url' && (
        <div>
          <label htmlFor="sitemap-url" className="ace-section-kicker block mb-2">
            Sitemap source
          </label>
          <div className="flex gap-2">
            <input
              id="sitemap-url"
              type="url"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/ or https://example.com/sitemap.xml"
              className="ace-input flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !sitemapUrl.trim()}
              className="ace-btn whitespace-nowrap"
            >
              {isLoading ? 'Analyzing…' : 'Fetch & Analyze'}
            </button>
          </div>
          <p className="text-xs text-ink-soft mt-3 max-w-2xl">
            Enter any URL. We auto-discover the sitemap via robots.txt and common
            paths, or paste the sitemap URL directly.
          </p>
        </div>
      )}

      {activeTab === 'xml' && (
        <div>
          <label htmlFor="xml-content" className="ace-section-kicker block mb-2">
            Paste Sitemap XML
          </label>
          <textarea
            id="xml-content"
            value={xmlContent}
            onChange={(e) => setXmlContent(e.target.value)}
            placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n  …\n</urlset>'}
            rows={8}
            className="ace-input w-full font-mono text-xs"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !xmlContent.trim()}
            className="ace-btn mt-3"
          >
            {isLoading ? 'Analyzing…' : 'Analyze XML'}
          </button>
        </div>
      )}

      {activeTab === 'urls' && (
        <div>
          <label htmlFor="url-list" className="ace-section-kicker block mb-2">
            Paste URL List · one per line or comma-separated
          </label>
          <textarea
            id="url-list"
            value={urlList}
            onChange={(e) => setUrlList(e.target.value)}
            placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/products/widget-1\n…'}
            rows={8}
            className="ace-input w-full font-mono text-xs"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !urlList.trim()}
            className="ace-btn mt-3"
          >
            {isLoading ? 'Analyzing…' : 'Analyze URLs'}
          </button>
        </div>
      )}
    </div>
  )
}
