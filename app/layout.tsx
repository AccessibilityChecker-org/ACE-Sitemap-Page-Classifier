import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ACE™ Sitemap Page Classifier — AccessibilityChecker.org',
  description: 'Internal quoting tool for AccessibilityChecker.org managed accessibility services',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                {/* Logo mark — AccessibilityChecker.org shield */}
                <div className="flex items-center justify-center w-8 h-8 bg-green-600 rounded-lg">
                  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M9 1L16.5 4.5V9.5C16.5 13.9 13.2 18 9 19C4.8 18 1.5 13.9 1.5 9.5V4.5L9 1Z"
                      fill="white"
                      fillOpacity="0.18"
                      stroke="white"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.5 10L7.8 12.3L12.5 7.5"
                      stroke="white"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-sm tracking-tight">
                      ACE™ Sitemap Page Classifier
                    </span>
                    <span className="hidden sm:inline text-gray-500 text-xs">|</span>
                    <span className="hidden sm:inline text-gray-400 text-xs">AccessibilityChecker.org</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  INTERNAL TOOL
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  SERVER ON
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-gray-900 border-t border-gray-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-gray-500 text-xs text-center">
              ACE™ Sitemap Page Classifier &mdash; Internal Tool &mdash; AccessibilityChecker.org &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
