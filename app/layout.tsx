import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

// Body sans — IBM Plex Sans. Characterful, readable, not Inter.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

// Mono family — used for display, data, labels, chips. Scanner/terminal aesthetic.
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ACE // Sitemap Scanner — AccessibilityChecker.org',
  description: 'Internal scanning instrument for AccessibilityChecker.org managed accessibility services.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${jetbrains.variable}`}
    >
      <body className="font-body antialiased">
        <header className="ace-header">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-14 gap-6">
              {/* Left: brand */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="ace-logo-crop" aria-label="AccessibilityChecker.org">
                  <Image
                    src="/ac-logo.png"
                    alt="AccessibilityChecker.org"
                    width={1680}
                    height={1050}
                    priority
                    className="ace-logo-img"
                  />
                </div>
                <span className="ace-rule-v hidden md:inline-block" aria-hidden />
                <div className="hidden md:flex items-center gap-2 font-mono text-[12px] text-ink">
                  <span className="font-bold tracking-[0.04em]">ACE</span>
                  <span className="text-[color:var(--brand)] font-bold">//</span>
                  <span className="uppercase tracking-[0.08em] text-ink-2">Sitemap Scanner</span>
                </div>
              </div>

              {/* Right: status */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="ace-chip-mono">
                  <span>INTERNAL</span>
                </span>
                <span className="ace-chip-mono ace-chip-mono--live">
                  <span className="ace-dot" aria-hidden />
                  <span>SYSTEM OK</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="mt-24 border-t border-rule bg-surface">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-8 grid md:grid-cols-3 gap-4 items-center">
            <div className="font-mono text-[13px] font-bold tracking-[0.02em] text-ink">
              ACE <span className="text-[color:var(--brand)]">//</span> SITEMAP SCANNER
            </div>
            <p className="text-[13px] text-ink-3">
              Internal instrument for composing managed-accessibility proposals.
              Distribute outputs under NDA only.
            </p>
            <div className="font-mono text-[10px] text-ink-4 md:text-right uppercase tracking-[0.22em]">
              © {new Date().getFullYear()} &nbsp;·&nbsp; v1 &nbsp;·&nbsp; INTERNAL
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
