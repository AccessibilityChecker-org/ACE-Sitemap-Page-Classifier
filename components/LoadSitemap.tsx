'use client'

import { useState } from 'react'
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
}

type Tab = 'url' | 'xml' | 'urls'

export default function LoadSitemap({ weights, onAnalyze, onLoadDemo, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('url')
  const [sitemapUrl, setSitemapUrl] = useState('')
  const [xmlContent, setXmlContent] = useState('')
  const [urlList, setUrlList] = useState('')

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 bg-green-600 text-white text-xs font-bold rounded-full">
            1
          </div>
          <h2 className="text-gray-900 font-semibold text-base">Load Sitemap</h2>
        </div>
        <button
          onClick={onLoadDemo}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={12} />
          Demo: Shopify Jewelry (~6K pages)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'url' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="sitemap-url" className="block text-xs font-medium text-gray-700 mb-1.5">
              Sitemap URL
            </label>
            <div className="flex gap-2">
              <input
                id="sitemap-url"
                type="url"
                value={sitemapUrl}
                onChange={(e) => setSitemapUrl(e.target.value)}
                placeholder="https://example.com/ or https://example.com/sitemap.xml"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={isLoading}
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !sitemapUrl.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLoading ? 'Analyzing...' : 'Fetch & Analyze'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Enter any URL — we&apos;ll auto-discover the sitemap via robots.txt and common paths. Or paste the sitemap URL directly.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'xml' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="xml-content" className="block text-xs font-medium text-gray-700 mb-1.5">
              Paste Sitemap XML
            </label>
            <textarea
              id="xml-content"
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n  ...\n</urlset>'}
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !xmlContent.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze XML'}
          </button>
        </div>
      )}

      {activeTab === 'urls' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="url-list" className="block text-xs font-medium text-gray-700 mb-1.5">
              Paste URL List (one per line or comma-separated)
            </label>
            <textarea
              id="url-list"
              value={urlList}
              onChange={(e) => setUrlList(e.target.value)}
              placeholder={'https://example.com/\nhttps://example.com/about\nhttps://example.com/products/widget-1\n...'}
              rows={8}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-xs"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !urlList.trim()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze URLs'}
          </button>
        </div>
      )}
    </div>
  )
}
