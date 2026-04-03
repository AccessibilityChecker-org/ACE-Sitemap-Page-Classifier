'use client'

import { useState } from 'react'
import { BookmarkPlus, Trash2, ChevronDown, ChevronUp, Database } from 'lucide-react'
import type { AnalysisResult, AnalysisSnapshot, PricingRecommendation } from '@/types'

interface Props {
  currentAnalysis: AnalysisResult
  currentRecommendation: PricingRecommendation
  snapshots: AnalysisSnapshot[]
  onSave: (snapshot: AnalysisSnapshot) => void
  onDelete: (id: string) => void
}

export default function SnapshotPanel({
  currentAnalysis,
  currentRecommendation,
  snapshots,
  onSave,
  onDelete,
}: Props) {
  const [open, setOpen]   = useState(false)
  const [name, setName]   = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    const snapshot: AnalysisSnapshot = {
      id:             `snap_${Date.now()}`,
      name:           trimmed,
      savedAt:        new Date().toISOString(),
      analysis:       currentAnalysis,
      recommendation: currentRecommendation,
    }
    onSave(snapshot)
    setName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Database size={15} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700">Case Study Snapshots</span>
          {snapshots.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700">
              {snapshots.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-gray-400" />
        ) : (
          <ChevronDown size={15} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          {/* Save current analysis */}
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Save this analysis as a named snapshot to compare it against future runs.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={`e.g. ${currentAnalysis.domain} — baseline`}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300"
              />
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <BookmarkPlus size={14} />
                {saved ? 'Saved!' : 'Save Snapshot'}
              </button>
            </div>
          </div>

          {/* Saved snapshot list */}
          {snapshots.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              No snapshots saved yet. Save this analysis to start comparing.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Saved Snapshots
              </p>
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{snap.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {snap.analysis.domain}
                      {' · '}
                      {snap.analysis.weightedPageCount.toLocaleString()} weighted pages
                      {' · '}
                      {snap.recommendation.weightedPlan?.name ?? 'Custom plan'}
                      {' · '}
                      {new Date(snap.savedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(snap.id)}
                    className="ml-3 p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
                    title="Delete snapshot"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {snapshots.length >= 2 && (
            <p className="text-xs text-indigo-600 font-medium">
              ✓ {snapshots.length} snapshots saved — scroll down to compare them side by side.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
