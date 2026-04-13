import type { Metadata } from 'next'
import { Instrument_Serif, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import Image from 'next/image'
import './globals.css'

// Editorial display serif — italic variant used for section numerals & headlines.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

// Body sans — IBM Plex Sans. Characterful, editorial, not Inter/Arial/Roboto.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

// Data / tabular display — IBM Plex Mono.
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ACE™ Sitemap Page Classifier — AccessibilityChecker.org',
  description: 'Internal quoting instrument for AccessibilityChecker.org managed accessibility services.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="font-body antialiased">
        <header className="ace-header">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-20 gap-6">
              {/* Left: brand lockup */}
              <div className="flex items-center gap-5 min-w-0">
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
                <div className="hidden md:flex flex-col leading-tight min-w-0">
                  <span className="ace-kicker">ACE™ Instrument</span>
                  <span className="font-display italic text-[22px] text-ink truncate">
                    Sitemap Page Classifier
                  </span>
                </div>
              </div>

              {/* Right: status stack */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="ace-badge ace-badge--ochre">
                  <span className="tracking-[0.14em]">INTERNAL ONLY</span>
                </span>
                <span className="ace-badge ace-badge--live">
                  <span className="ace-dot" aria-hidden />
                  <span className="tracking-[0.14em]">LIVE</span>
                </span>
              </div>
            </div>
          </div>
          <div className="ace-header-rule" aria-hidden />
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="mt-24 border-t border-[color:var(--rule)]">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 grid md:grid-cols-3 gap-6 items-start">
            <div className="font-display italic text-[26px] leading-none text-ink">
              AccessibilityChecker<span className="text-[color:var(--forest)]">.</span>
            </div>
            <p className="text-sm text-ink-muted md:col-span-1">
              ACE™ Sitemap Page Classifier is an internal instrument for composing
              managed-accessibility proposals. Distribute outputs under NDA only.
            </p>
            <div className="text-xs font-mono text-ink-muted md:text-right uppercase tracking-[0.18em]">
              © {new Date().getFullYear()} &nbsp;·&nbsp; v1 &nbsp;·&nbsp; Internal
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
