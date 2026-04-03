'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface Props {
  value: string          // ISO YYYY-MM-DD or ''
  onChange: (iso: string) => void
  placeholder?: string
  className?: string
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function parseISO(iso: string): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return isNaN(dt.getTime()) ? null : dt
}

function fmtDisplay(iso: string): string {
  const d = parseISO(iso)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', className }: Props) {
  const today = new Date()
  const selected = parseISO(value)

  const [open, setOpen]         = useState(false)
  const [mode, setMode]         = useState<'calendar' | 'year'>('calendar')
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth())
  const [viewYear, setViewYear]   = useState(selected?.getFullYear() ?? today.getFullYear())

  const containerRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) {
      setViewMonth(selected.getMonth())
      setViewYear(selected.getFullYear())
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build calendar cells (null = empty padding)
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    onChange(d.toISOString().slice(0, 10))
    setOpen(false)
  }

  function isSelected(day: number) {
    return !!selected &&
      selected.getFullYear() === viewYear &&
      selected.getMonth()    === viewMonth &&
      selected.getDate()     === day
  }

  function isToday(day: number) {
    return today.getFullYear() === viewYear &&
      today.getMonth()    === viewMonth &&
      today.getDate()     === day
  }

  // Year range: 2 years back, 6 years forward
  const yearRange = Array.from({ length: 9 }, (_, i) => today.getFullYear() - 2 + i)
  const displayValue = fmtDisplay(value)

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setMode('calendar') }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white text-left hover:border-gray-300 transition-colors"
      >
        <Calendar size={12} className="text-gray-400 shrink-0" />
        <span className={displayValue ? 'text-gray-800' : 'text-gray-400 italic'}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            onKeyDown={(e) => e.key === 'Enter' && onChange('')}
            className="ml-auto text-gray-300 hover:text-gray-500 text-base leading-none cursor-pointer"
          >
            ×
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-xl w-64 overflow-hidden">
          {mode === 'calendar' ? (
            <>
              {/* Month/year header */}
              <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={13} className="text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('year')}
                  className="text-sm font-semibold text-gray-800 hover:text-green-600 transition-colors px-2"
                >
                  {MONTHS[viewMonth]} {viewYear}
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight size={13} className="text-gray-600" />
                </button>
              </div>

              {/* Day-of-week labels */}
              <div className="grid grid-cols-7 px-2 pt-2.5">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-xs text-gray-400 font-medium pb-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 px-2 pb-3">
                {cells.map((day, i) => (
                  <div key={i} className="flex items-center justify-center p-0.5">
                    {day ? (
                      <button
                        type="button"
                        onClick={() => selectDay(day)}
                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                          isSelected(day)
                            ? 'bg-green-600 text-white shadow-sm'
                            : isToday(day)
                            ? 'bg-green-100 text-green-700 font-bold ring-1 ring-green-400'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {day}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Year picker grid */
            <div className="p-3">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Select Year
                </p>
                <button
                  type="button"
                  onClick={() => setMode('calendar')}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ← Back
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {yearRange.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setMode('calendar') }}
                    className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                      y === viewYear
                        ? 'bg-green-600 text-white shadow-sm'
                        : y === today.getFullYear()
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
